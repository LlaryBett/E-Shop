import axios from 'axios';

const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://e-shop-pwxx.vercel.app/api' // Update this in production
    : 'https://e-shop-pwxx.vercel.app/api';

// Authenticated API instance — automatically attaches JWT from localStorage
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle expired or missing token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthRoute =
        ['/login', '/reset-password', '/verify-email', '/forgot-password'].some((route) =>
          currentPath.includes(route)
        );

      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Public API instance — no token attached
api.public = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
