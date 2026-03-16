import axios from 'axios';

// Priority:
// 1. VITE_API_URL env var (set in Vercel dashboard) → used in production
// 2. /api → used in local dev (Vite proxy forwards to localhost:5000)
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cinestream_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // For FormData, let browser set Content-Type (multipart boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Global response error handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;

    console.error(`[API Error] ${err.config?.method?.toUpperCase()} ${err.config?.url} → ${status}: ${message}`);

    if (status === 401) {
      localStorage.removeItem('cinestream_token');
      localStorage.removeItem('cinestream_user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;
