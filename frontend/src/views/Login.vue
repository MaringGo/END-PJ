<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-center mb-6">Login</h2>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="label">
            <span class="label-text">Email</span>
          </label>
          <input 
            v-model="email" 
            type="email" 
            class="input input-bordered w-full"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label class="label">
            <span class="label-text">Password</span>
          </label>
          <input 
            v-model="password" 
            type="password" 
            class="input input-bordered w-full"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary w-full">
          Login
        </button>
      </form>

      <div class="mt-4 text-center">
        <p class="text-gray-600">
          Don't have an account? 
          <router-link to="/register" class="text-primary font-semibold">Register</router-link>
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
import axios from 'axios';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const router = useRouter();

    const handleLogin = async () => {
      try {
        const response = await axios.post('/api/auth/login', {
          email: email.value,
          password: password.value
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        router.push('/dashboard');
      } catch (err) {
        error.value = err.response?.data?.error || 'Login failed';
      }
    };

    return { email, password, error, handleLogin };
  }
};
</script>
