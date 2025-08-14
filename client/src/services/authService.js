import api from './api';

class AuthService {
  // 🔐 Authentication
  async login(data) {
    try {
      console.log('🔐 Starting login process...');
      const response = await api.post('/auth/login', data, { withCredentials: true });
      
      console.log('🔐 Login response received:', response.status);
      
      // Additional cookie check after successful login
      if (response.status === 200) {
        setTimeout(() => {
          const hasToken = document.cookie.includes('token=');
          console.log('🔐 Post-login cookie check:', hasToken ? 'Cookie found' : 'No cookie');
          
          if (!hasToken) {
            console.warn('🚨 Login succeeded but no cookie was set!');
            // You might want to show a warning to the user here
          }
        }, 200);
      }
      
      return response.data;
    } catch (error) {
      console.error('🔐 Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async register(data) {
    const response = await api.post('/auth/register', data, { withCredentials: true });
    return response.data;
  }

  async logout() {
    try {
      console.log('🚪 Starting logout...');
      await api.post('/auth/logout', {}, { withCredentials: true });
      
      // Clear any client-side storage if needed
      console.log('🚪 Logout successful');
    } catch (error) {
      console.error('🚪 Logout error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMe() {
    try {
      console.log('👤 Getting user info...');
      const response = await api.get('/auth/me', { withCredentials: true });
      console.log('👤 User info retrieved successfully');
      return response.data.user;
    } catch (error) {
      console.error('👤 Failed to get user info:', error.response?.data || error.message);
      throw error;
    }
  }

  // Test method to check if cookies are working
  async testCookies() {
    console.log('🧪 Testing cookie functionality...');
    
    try {
      // Try to make an authenticated request
      const response = await api.get('/auth/me', { withCredentials: true });
      console.log('✅ Cookie test passed - user is authenticated', {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Cookie test failed - user not authenticated');
        console.log('🔍 Current cookies:', document.cookie);
        return {
          success: false,
          status: error.response.status,
          cookies: document.cookie
        };
      }
      throw error;
    }
  }

  // Manual cookie check method
  isLoggedIn() {
    const hasTokenCookie = document.cookie.includes('token=');
    console.log('🔍 Manual login check - cookie exists:', hasTokenCookie);
    return hasTokenCookie;
  }

  // 🔑 Other methods remain the same...
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email }, { withCredentials: true });
    return response.data;
  }

  async resetPassword(token, password) {
    const response = await api.put(`/auth/reset-password/${token}`, { password }, { withCredentials: true });
    return response.data;
  }

  async updatePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/update-password', { currentPassword, newPassword }, { withCredentials: true });
    return response.data;
  }

  async resendVerificationEmail() {
    const response = await api.post('/auth/resend-verification', {}, { withCredentials: true });
    return response.data;
  }

  async verifyEmail(token) {
    const response = await api.get(`/auth/verify-email/${token}`, { withCredentials: true });
    return response.data;
  }

  async sendPasswordResetEmail(email) {
    const response = await api.post('/auth/forgot-password', { email }, { withCredentials: true });
    return response.data;
  }
}

export default new AuthService();