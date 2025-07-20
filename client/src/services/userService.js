import api from './api';

class UserService {
  // 👤 Profile
  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response.data.user;
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.avatarUrl;
  }

  // 📦 Addresses
  async getAddresses() {
    const response = await api.get('/users/addresses');
    return response.data.addresses;
  }

  async addAddress(address) {
    const response = await api.post('/users/addresses', address);
    return response.data.address;
  }

  async updateAddress(id, address) {
    const response = await api.put(`/users/addresses/${id}`, address);
    return response.data.address;
  }

  async deleteAddress(id) {
    await api.delete(`/users/addresses/${id}`);
  }

  // 💖 Wishlist
  async getWishlist() {
    const response = await api.get('/users/wishlist');
    return response.data.wishlist;
  }

  async addToWishlist(productId) {
    await api.post('/users/wishlist', { productId });
  }

  async removeFromWishlist(productId) {
    await api.delete(`/users/wishlist/${productId}`);
  }

  // 🧑‍💼 Admin: Get all users
  async getAllUsers() {
    const response = await api.get('/users');
    return response.data.users;
  }

  // 🔐 Account: Update password
  async updatePassword(passwordData) {
    await api.put('/users/password', passwordData); // Expects { currentPassword, newPassword }
  }

  // 📰 Newsletter
  async subscribeNewsletter(email) {
    const response = await api.post('/newsletter/subscribe', { email });
    return response.data;
  }

  // 📩 Contact Form
  async submitContactForm(data) {
    const response = await api.post('/contact', data); // { name, email, subject, message }
    return response.data.message;
  }

  // 🛡️ Admin: Contact management
  async getAllContactMessages() {
    const response = await api.get('/contact');
    // Support both { messages: [...] } and { data: [...] }
    if (Array.isArray(response.data.messages)) {
      return response.data.messages;
    }
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }

  async updateContactMessageStatus(id, status, replyContent) {
    // Send replyContent if provided
    const payload = replyContent ? { status, reply: replyContent } : { status };
    const response = await api.patch(`/contact/${id}`, payload);
    // Support both { message: ... } and { data: ... }
    return response.data.data || response.data.message;
  }

  async deleteContactMessage(id) {
    await api.delete(`/contact/${id}`);
  }
}

export default new UserService();
