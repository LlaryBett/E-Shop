import api from './api';

class AuthService {
  // Store token in localStorage (or sessionStorage)
  storeToken(token) {
    localStorage.setItem('token', token);
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }

  // Remove token
  clearToken() {
    localStorage.removeItem('token');
  }

  // 🔐 Authentication
  async login(data) {
    try {
      console.log('🔐 Starting login process...');
      const response = await api.post('/auth/login', data);
      
      console.log('🔐 Login response received:', response.status);
      
      if (response.data.token) {
        this.storeToken(response.data.token);
        console.log('🔐 Token stored successfully');
      }
      
      return response.data;
    } catch (error) {
      console.error('🔐 Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      this.storeToken(response.data.token);
    }
    return response.data;
  }

  async logout() {
    try {
      console.log('🚪 Starting logout...');
      // Clear the token from storage
      this.clearToken();
      
      // Optional: Call the server to invalidate the token if needed
      await api.post('/auth/logout');
      
      console.log('🚪 Logout successful');
    } catch (error) {
      console.error('🚪 Logout error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMe() {
    try {
      console.log('👤 Getting user info...');
      const response = await api.get('/auth/me');
      console.log('👤 User info retrieved successfully');
      return response.data.user;
    } catch (error) {
      console.error('👤 Failed to get user info:', error.response?.data || error.message);
      throw error;
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    const hasToken = !!this.getToken();
    console.log('🔍 Manual login check - token exists:', hasToken);
    return hasToken;
  }

  // 🔑 Password related methods
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token, password) {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    if (response.data.token) {
      this.storeToken(response.data.token);
    }
    return response.data;
  }

  async updatePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/update-password', { currentPassword, newPassword });
    if (response.data.token) {
      this.storeToken(response.data.token);
    }
    return response.data;
  }

  async resendVerificationEmail() {
    const response = await api.post('/auth/resend-verification', {});
    return response.data;
  }

  async verifyEmail(token) {
    const response = await api.get(`/auth/verify-email/${token}`);
    if (response.data.token) {
      this.storeToken(response.data.token);
    }
    return response.data;
  }

  async sendPasswordResetEmail(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }
}

export default new AuthService();