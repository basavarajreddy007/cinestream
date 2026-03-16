import axios from 'axios';

// In production (Vercel), point to your deployed backend URL.
// Set VITE_API_URL in Vercel environment variables.
// In dev, Vite proxy handles /api → localhost:5000.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('cinestream_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cinestream_token');
      localStorage.removeItem('cinestream_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
