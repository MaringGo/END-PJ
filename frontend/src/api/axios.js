import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl.replace(/\/+$/, '')}/api`;
}

const api = axios.create({
  baseURL: rawUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
