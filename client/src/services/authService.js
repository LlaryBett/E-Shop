import api from './api';

class AuthService {
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
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  async forgotPassword(email) {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token, password) {
    await api.put(`/auth/reset-password/${token}`, { password });
  }

  async updatePassword(currentPassword, newPassword) {
    await api.put('/auth/update-password', { currentPassword, newPassword });
  }

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