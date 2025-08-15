// 3. UPDATE YOUR EXISTING authService - Add verification check method
import api from './api';

class AuthService {
  // 🔐 Authentication
  async login(data) {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async logout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  // 🔑 Password / Email
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token, password) {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  }

  async updatePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/update-password', { currentPassword, newPassword });
    return response.data;
  }

  async resendVerificationEmail() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  }

  async verifyEmail(token) {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  }

  async sendPasswordResetEmail(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  }

  // 🔑 Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // NEW: Helper to check if verification error occurred
  isVerificationError(error) {
    return error.response?.status === 403 && error.response?.data?.code === 'EMAIL_NOT_VERIFIED';
  }
}

export default new AuthService();

// 4. HOW TO USE IN YOUR CHECKOUT COMPONENT
// In your checkout/order component, handle the verification error like this:

