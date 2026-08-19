import { defineStore } from 'pinia';
import api from '../api/axios';

const getSafeJSON = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val && val !== 'undefined' ? JSON.parse(val) : null;
  } catch (e) {
    return null;
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: getSafeJSON('user'),
    token: localStorage.getItem('token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isManager: (state) => state.user?.role === 'manager',
  },
  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { email, password });
        this.setAuthData(response.data);
        return true;
      } catch (error) {
        throw error;
      }
    },
    async register(username, email, password) {
      try {
        const response = await api.post('/auth/register', { username, email, password });
        this.setAuthData(response.data);
        return true;
      } catch (error) {
        throw error;
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    setAuthData(data) {
      this.user = data.user;
      this.token = data.token;
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    }
  }
});
