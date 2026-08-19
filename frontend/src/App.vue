<template>
  <div id="app" class="min-h-screen bg-base-200">
    <!-- Navigation Bar -->
    <div class="navbar bg-base-100 shadow-sm sticky top-0 z-50 px-4 lg:px-8">
      <div class="flex-1">
        <router-link to="/" class="btn btn-ghost text-xl font-bold text-primary">
          🍽️ <span class="hidden sm:inline">ร้านอาหาร</span>
        </router-link>
      </div>
      <div class="flex-none gap-2">
        <!-- Cart Button (Always visible for all users, crucial for mobile) -->
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
            <div class="indicator">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <span class="badge badge-sm badge-primary indicator-item" v-if="cartStore.itemCount > 0">{{ cartStore.itemCount }}</span>
            </div>
          </div>
          <div tabindex="0" class="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow-xl">
            <div class="card-body">
              <span class="font-bold text-lg">{{ cartStore.itemCount }} รายการ</span>
              <span class="text-info">รวม: ฿{{ cartStore.totalPrice.toFixed(2) }}</span>
              <div class="card-actions">
                <router-link to="/cart" class="btn btn-primary btn-block">ดูตะกร้าสินค้า</router-link>
              </div>
            </div>
          </div>
        </div>

        <template v-if="authStore.isAuthenticated">
          <!-- User Menu -->
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar placeholder">
              <div class="bg-neutral text-neutral-content rounded-full w-10">
                <span class="text-xs">{{ authStore.user?.username?.charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li class="menu-title">
                <span>{{ authStore.user?.username }} ({{ translateRole(authStore.user?.role) }})</span>
              </li>
              <li><router-link to="/profile">โปรไฟล์ส่วนตัว</router-link></li>
              <li><router-link to="/orders">ประวัติการสั่งซื้อ</router-link></li>
              <li v-if="authStore.isAdmin || authStore.isManager"><router-link to="/dashboard">แดชบอร์ดผู้ดูแล</router-link></li>
              <li><a @click="handleLogout" class="text-error">ออกจากระบบ</a></li>
            </ul>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-primary btn-sm">เข้าสู่ระบบ</router-link>
          <router-link to="/register" class="btn btn-outline btn-sm hidden sm:inline-flex">สมัครสมาชิก</router-link>
        </template>
      </div>
    </div>

    <!-- Main Content -->
    <main class="pb-12">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useCartStore } from './stores/cart';

const authStore = useAuthStore();
const cartStore = useCartStore();
const router = useRouter();

onMounted(() => {
  cartStore.loadFromStorage();
});

const translateRole = (role) => {
  if (!role) return '';
  const roleMap = {
    'admin': 'ผู้ดูแลระบบ',
    'manager': 'ผู้จัดการ',
    'customer': 'ลูกค้า',
    'chef': 'เชฟ',
    'staff': 'พนักงาน'
  };
  return roleMap[role.toLowerCase()] || role;
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style>
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
