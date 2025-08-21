// 1. UPDATE YOUR EXISTING api.js - Add verification error handling
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://e-shop-4-u33b.onrender.com/api'
    : 'https://e-shop-4-u33b.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

const PROTECTED_ROUTES = ['/orders', '/profile', '/wishlist', '/cart', '/checkout'];

// UPDATED: Enhanced response interceptor to handle verification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.startsWith(route));
      const isAuthRoute =
        ['/login', '/reset-password', '/verify-email', '/forgot-password'].some((route) =>
          currentPath.includes(route)
        );

      if (isProtectedRoute && !isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`;
      }
    }
    
    // NEW: Handle email verification required errors
    if (error.response?.status === 403 && error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
      // Let the calling component handle this - don't redirect automatically
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

api.public = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
