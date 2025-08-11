import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_API_URL
    : 'https://e-shop-4-u33b.onrender.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Skip auth header for public endpoints
    if (!config._isPublic) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Skip redirect logic for public endpoints
      if (!error.config?._isPublic) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        const currentPath = window.location.pathname;
        const isAuthRoute = currentPath.includes('/login') || 
                           currentPath.includes('/reset-password') || 
                           currentPath.includes('/verify-email') ||
                           currentPath.includes('/forgot-password');
        
        if (!isAuthRoute) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Creates a public API instance that won't trigger auth checks
 */
api.public = axios.create({
  baseURL: import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;