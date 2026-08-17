<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-primary">🍽️ Restaurant</h1>
          </div>
          <div class="flex items-center gap-4">
            <template v-if="user">
              <span class="text-sm text-gray-600">Welcome, {{ user.username }} ({{ user.role }})</span>
              <button @click="logout" class="btn btn-sm btn-outline">Logout</button>
            </template>
            <template v-else>
              <router-link to="/login" class="btn btn-sm btn-primary">Login</router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <router-view />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'App',
  setup() {
    const user = ref(null);
    const router = useRouter();

    onMounted(() => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        user.value = JSON.parse(userData);
      }
    });

    const logout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      user.value = null;
      router.push('/login');
    };

    return { user, logout };
  }
};
</script>

<style scoped>
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
</style>
