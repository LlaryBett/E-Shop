import api from './api';

class AuthService {
  // 🔐 Authentication
  async login(data) {
    const response = await api.post('/auth/login', data, { withCredentials: true });
    return response.data;
  }

  async register(data) {
    const response = await api.post('/auth/register', data, { withCredentials: true });
    return response.data;
  }

  async logout() {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMe() {
    const response = await api.get('/auth/me', { withCredentials: true });
    return response.data.user;
  }

  // 🔑 Password / Email
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

  /**
   * Send a password reset email to the user
   * @param {string} email - The user's email address
   * @returns {Promise} - API response
   */
  async sendPasswordResetEmail(email) {
    const response = await api.post('/auth/forgot-password', { email }, { withCredentials: true });
    return response.data;
  }
}

export default new AuthService();