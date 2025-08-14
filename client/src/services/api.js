// api.js - Enhanced with better debugging
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

// Enhanced debugging functions
const debugCookies = () => {
  const allCookies = document.cookie;
  console.log('🔍 All browser cookies:', allCookies || 'No cookies found');
  
  if (allCookies) {
    const cookieArray = allCookies.split('; ').map(cookie => {
      const [name, value] = cookie.split('=');
      return { name, value: value?.substring(0, 20) + '...' };
    });
    console.log('🔍 Parsed cookies:', cookieArray);
  }
  
  // Check specifically for token cookie
  const tokenCookie = allCookies.split('; ').find(row => row.startsWith('token='));
  console.log('🔍 Token cookie:', tokenCookie ? 'Found' : 'Not found');
};

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making request to:', config.url);
    console.log('🚀 With credentials:', config.withCredentials);
    console.log('🚀 Headers:', config.headers);
    
    // Enhanced cookie debugging
    debugCookies();
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response from:', response.config.url);
    console.log('✅ Status:', response.status);
    console.log('✅ Set-Cookie header:', response.headers['set-cookie']);
    console.log('✅ All response headers:', response.headers);
    
    // Special handling for login response
    if (response.config.url?.includes('/auth/login') && response.status === 200) {
      console.log('🍪 Login successful - checking cookies...');
      
      // Wait a bit for cookie to be set, then check
      setTimeout(() => {
        debugCookies();
        
        // Try to manually check if cookie was set
        const cookieWasSet = document.cookie.includes('token=');
        console.log('🍪 Cookie set after login:', cookieWasSet);
        
        if (!cookieWasSet) {
          console.error('🚨 COOKIE NOT SET AFTER LOGIN!');
          console.log('🔧 Possible issues:');
          console.log('  1. Browser blocking third-party cookies');
          console.log('  2. Secure cookie settings');
          console.log('  3. SameSite policy');
          console.log('  4. Domain mismatch');
        }
      }, 100);
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
      
      console.log('🚪 401 Error - checking cookies:');
      debugCookies();
      
      if (!isAuthRoute) {
        console.log('🚪 Would redirect to login due to 401, but DISABLED for debugging');
        console.log('🚪 Current path:', currentPath);
        console.log('🚪 Is auth route:', isAuthRoute);
        // window.location.href = '/login'; // ← COMMENTED OUT FOR DEBUGGING
      }
    }
    return Promise.reject(error);
  }
);

export default api;