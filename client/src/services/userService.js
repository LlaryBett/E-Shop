import api from './api';

class UserService {
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
}

export default new UserService();