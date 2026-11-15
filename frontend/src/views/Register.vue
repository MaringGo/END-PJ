<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-center mb-6">Register</h2>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="label"><span class="label-text">Username</span></label>
          <input v-model="username" type="text" class="input input-bordered w-full" placeholder="ชื่อผู้ใช้" required />
        </div>
        <div>
          <label class="label"><span class="label-text">Email</span></label>
          <input v-model="email" type="email" class="input input-bordered w-full" placeholder="your@email.com" required />
        </div>
        <div>
          <label class="label"><span class="label-text">Password</span></label>
          <input v-model="password" type="password" class="input input-bordered w-full" placeholder="••••••••" required />
        </div>
        <button type="submit" class="btn btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          Register
        </button>
      </form>

      <div class="mt-4 text-center">
        <p class="text-gray-600">
          Already have an account? 
          <router-link to="/login" class="text-primary font-semibold">Login</router-link>
        </p>
      </div>

      <div v-if="error" class="mt-4 alert alert-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'Register',
  setup() {
    const username = ref('');
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const loading = ref(false);
    const router = useRouter();
    const authStore = useAuthStore();

    const handleRegister = async () => {
      loading.value = true;
      error.value = '';
      try {
        await authStore.register(username.value, email.value, password.value);
        if (authStore.isAdmin || authStore.isManager) {
          router.push('/dashboard');
        } else if (authStore.user?.role === 'chef' || authStore.user?.role === 'staff') {
          router.push('/kitchen');
        } else {
          router.push('/products');
        }
      } catch (err) {
        error.value = err.response?.data?.error || err.response?.data?.details || 'Registration failed';
      } finally {
        loading.value = false;
      }
    };

    return { username, email, password, error, loading, handleRegister };
  }
};
</script>
