import api from './api';

class AuthService {
  // 🔐 Authentication
  async login(data) {
    const response = await api.post('/auth/login', data);
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(data) {
    const response = await api.post('/auth/register', data);
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  // 🔑 Password / Email
  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token, password) {
    return api.put(`/auth/reset-password/${token}`, { password });
  }

  async updatePassword(currentPassword, newPassword) {
    return api.put('/auth/update-password', { currentPassword, newPassword });
  }

  async resendVerificationEmail() {
    return api.post('/auth/resend-verification');
  }

  async verifyEmail(token) {
    return api.get(`/auth/verify-email/${token}`);
  }

  // 📦 Helpers
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
