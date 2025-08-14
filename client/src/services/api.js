import axios from 'axios';

const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://e-shop-3-2mab.onrender.com/api' // Change this in production
    : 'https://e-shop-3-2mab.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends cookies when needed
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token from localStorage
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
        currentPath.includes('/login') ||
        currentPath.includes('/reset-password') ||
        currentPath.includes('/verify-email') ||
        currentPath.includes('/forgot-password');

      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Public API instance (no auth token)
api.public = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
