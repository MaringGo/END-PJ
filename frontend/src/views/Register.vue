<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Register</h1>
      <div class="card bg-white shadow-xl">
        <div class="card-body">
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div>
              <label class="label"><span class="label-text">Username</span></label>
              <input v-model="username" type="text" class="input input-bordered w-full" required />
            </div>
            <div>
              <label class="label"><span class="label-text">Email</span></label>
              <input v-model="email" type="email" class="input input-bordered w-full" required />
            </div>
            <div>
              <label class="label"><span class="label-text">Password</span></label>
              <input v-model="password" type="password" class="input input-bordered w-full" required />
            </div>
            <button type="submit" class="btn btn-primary">Register</button>
          </form>
          <div v-if="error" class="alert alert-error mt-4">{{ error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'Register',
  setup() {
    const username = ref('');
    const email = ref('');
    const password = ref('');
    const error = ref('');
    const router = useRouter();

    const handleRegister = async () => {
      try {
        const response = await axios.post('/api/auth/register', {
          username: username.value,
          email: email.value,
          password: password.value
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        router.push('/dashboard');
      } catch (err) {
        error.value = err.response?.data?.error || 'Registration failed';
      }
    };

    return { username, email, password, error, handleRegister };
  }
};
</script>
