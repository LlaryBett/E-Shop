import axios from 'axios';

const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://e-shop-3-2mab.onrender.com/api'
  : 'https://e-shop-3-2mab.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor to inject token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (or sessionStorage)
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('🚀 Making request to:', config.url);
    console.log('🚀 Headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response from:', response.config.url);
    console.log('✅ Status:', response.status);
    
    // Store token if it's returned in login/register responses
    if (
      (response.config.url?.includes('/auth/login') || 
      response.config.url?.includes('/auth/register') ||
      response.config.url?.includes('/auth/reset-password')
    ) 
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('🔑 Token stored in localStorage');
      }
    }
    
    return response;
  },
  (error) => {
    console.error('❌ Response error from:', error.config?.url);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Error data:', error.response?.data);
    
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthRoute = ['/login', '/reset-password', '/verify-email', '/forgot-password']
        .some(route => currentPath.includes(route));
        
      if (!isAuthRoute) {
        console.log('🚪 Redirecting to login due to 401');
        // Clear stored token on 401
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;