import axios from 'axios';

const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://e-shop-3-2mab.onrender.com/api'
    : 'https://e-shop-3-2mab.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// REMOVED the request interceptor completely
// (No more localStorage token handling)

// Response interceptor stays the same
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
        // Removed localStorage cleanup (handled by HTTP-only cookies)
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Public API instance remains unchanged
api.public = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;