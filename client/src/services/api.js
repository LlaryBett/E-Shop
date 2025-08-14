import axios from 'axios';

const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://e-shop-3-2mab.onrender.com/api'
  : 'https://e-shop-3-2mab.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.url);
    console.log('🚀 With credentials:', config.withCredentials);
    console.log('🚀 Headers:', config.headers);
    console.log('🚀 All cookies in browser:', document.cookie);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with debugging
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response from:', response.config.url);
    console.log('✅ Status:', response.status);
    console.log('✅ Set-Cookie header:', response.headers['set-cookie']);
    console.log('✅ All response headers:', response.headers);
    
    // After login, check if cookie was set
    if (response.config.url?.includes('/auth/login') && response.status === 200) {
      console.log('🍪 After login - All cookies:', document.cookie);
      
      // Check if our token cookie exists
      const hasTokenCookie = document.cookie.includes('token=');
      console.log('🍪 Token cookie exists:', hasTokenCookie);
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
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Remove the redundant api.public - just use the main api instance
export default api;