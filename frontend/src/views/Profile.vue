<template>
  <div class="min-h-screen bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">โปรไฟล์ส่วนตัว</h1>
      
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
      
      <div v-else-if="error" class="alert alert-error shadow-lg mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
      </div>
      
      <div v-else class="card bg-base-100 shadow-sm border border-base-200">
        <div class="card-body">
          <form @submit.prevent="updateProfile">
            <div class="flex items-center gap-4 mb-8">
              <div class="avatar placeholder">
                <div class="bg-primary text-primary-content rounded-full w-20 h-20 text-3xl">
                  <span>{{ formData.username ? formData.username.charAt(0).toUpperCase() : 'U' }}</span>
                </div>
              </div>
              <div>
                <h2 class="text-2xl font-bold">{{ profile.username }}</h2>
                <div class="badge badge-accent mt-1 uppercase">{{ profile.role }}</div>
              </div>
            </div>

            <!-- Username -->
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">ชื่อผู้ใช้ (Username)</span>
              </label>
              <input 
                type="text" 
                v-model="formData.username" 
                class="input input-bordered w-full" 
                required
              />
            </div>

            <!-- Email -->
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">อีเมล (Email)</span>
              </label>
              <input 
                type="email" 
                v-model="formData.email" 
                class="input input-bordered w-full" 
                required
              />
            </div>

            <div class="divider my-6">เปลี่ยนรหัสผ่าน (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</div>

            <!-- New Password -->
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text font-semibold">รหัสผ่านใหม่</span>
              </label>
              <input 
                type="password" 
                v-model="formData.password" 
                placeholder="ระบุรหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)"
                class="input input-bordered w-full" 
              />
            </div>

            <!-- Success Message -->
            <div v-if="successMsg" class="alert alert-success mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{{ successMsg }}</span>
            </div>

            <div class="card-actions justify-end mt-8">
              <button 
                type="submit" 
                class="btn btn-primary px-8"
                :disabled="isSaving"
              >
                <span v-if="isSaving" class="loading loading-spinner"></span>
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api/axios';

const authStore = useAuthStore();
const profile = ref({});
const formData = ref({
  username: '',
  email: '',
  password: ''
});

const loading = ref(true);
const isSaving = ref(false);
const error = ref(null);
const successMsg = ref('');

const fetchProfile = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get('/auth/profile');
    profile.value = res.data;
    formData.value.username = res.data.username;
    formData.value.email = res.data.email;
  } catch (err) {
    console.error('Failed to fetch profile', err);
    if (err.response && (err.response.status === 404 || err.response.status === 401)) {
      // User doesn't exist anymore or token invalid, force logout
      authStore.logout();
      window.location.href = '/login';
    } else {
      error.value = 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้';
    }
  } finally {
    loading.value = false;
  }
};

const updateProfile = async () => {
  isSaving.value = true;
  error.value = null;
  successMsg.value = '';
  
  try {
    const payload = {
      username: formData.value.username,
      email: formData.value.email
    };
    
    if (formData.value.password) {
      payload.password = formData.value.password;
    }
    
    const res = await api.put('/auth/profile', payload);
    
    // Update local store
    authStore.setToken(res.data.token);
    authStore.setUser(res.data.user);
    
    // Update local state
    profile.value = res.data.user;
    formData.value.password = ''; // clear password field
    
    successMsg.value = 'อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว!';
    
    setTimeout(() => {
      successMsg.value = '';
    }, 3000);
    
  } catch (err) {
    console.error('Update failed', err);
    error.value = err.response?.data?.error || 'ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});
</script>
