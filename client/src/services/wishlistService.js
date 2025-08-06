import api from './api';
import AuthService from './authService';

const wishlistService = {
  /**
   * Protected request handler with auth check
   */
  async _makeRequest(method, endpoint, data = null) {
    if (!AuthService.isAuthenticated()) {
      throw Object.assign(new Error('Authentication required'), {
        isAuthError: true,
        suppressToast: true
      });
    }

    try {
      const config = {
        method,
        url: `/wishlist${endpoint}`,
        ...(data && { data }),
        _suppressAuthRedirect: true
      };
      const response = await api(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw Object.assign(new Error('Session expired'), {
          isAuthError: true
        });
      }
      throw error;
    }
  },

  async fetchWishlist() {
    try {
      const data = await this._makeRequest('get', '');
      return data?.items || [];
    } catch (error) {
      if (error.isAuthError) throw error;
      return []; // Return empty array for non-auth errors
    }
  },

  async addToWishlist(productId) {
    try {
      const data = await this._makeRequest('post', '', { productId });
      return data?.items || [];
    } catch (error) {
      if (error.isAuthError) throw error;
      throw new Error('Failed to add to wishlist');
    }
  },

  async removeFromWishlist(productId) {
    try {
      const data = await this._makeRequest('delete', `/${productId}`);
      return data?.items || [];
    } catch (error) {
      if (error.isAuthError) throw error;
      throw new Error('Failed to remove from wishlist');
    }
  },

  async clearWishlist() {
    try {
      await this._makeRequest('delete', '/clear');
      return []; // Always return empty array after clear
    } catch (error) {
      if (error.isAuthError) throw error;
      throw new Error('Failed to clear wishlist');
    }
  }
};

export default wishlistService;