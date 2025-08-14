import api from './api';
import AuthService from './authService';

class NotificationsService {
  /**
   * Safe request wrapper that handles auth checks
   */
  async _makeAuthRequest(method, url, data = null, params = {}) {
    if (!AuthService.isAuthenticated()) {
      throw Object.assign(new Error('Not authenticated'), {
        isAuthError: true,
        suppressToast: true
      });
    }

    try {
      const response = await api({
        method,
        url,
        data, // Will send {} when provided
        params,
        _suppressAuthRedirect: true
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw Object.assign(new Error('Session expired'), {
          isAuthError: true
        });
      }
      throw error;
    }
  }

  // 🔔 Notification methods
  async getNotifications(params = {}) {
    try {
      const data = await this._makeAuthRequest('get', '/notifications', null, params);
      return data?.data?.notifications || [];
    } catch (error) {
      if (error.isAuthError) throw error;
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  async getUnreadCount() {
    try {
      const data = await this._makeAuthRequest('get', '/notifications/unread-count');
      return data.count || 0;
    } catch (error) {
      if (error.isAuthError) throw error;
      return 0;
    }
  }

  async getNotificationById(id) {
    return this._makeAuthRequest('get', `/notifications/${id}`);
  }

  async createNotification(data) {
    return this._makeAuthRequest('post', '/notifications', data);
  }

  async markAsRead(id) {
    // Explicit empty body to ensure Content-Type
    return this._makeAuthRequest('patch', `/notifications/${id}/read`, {});
  }

  async markAllAsRead() {
    // Explicit empty body
    return this._makeAuthRequest('patch', '/notifications/read-all', {});
  }

  async bulkOperations(data) {
    return this._makeAuthRequest('post', '/notifications/bulk', data);
  }

  async deleteNotification(id) {
    // Explicit empty body
    return this._makeAuthRequest('delete', `/notifications/${id}`, {});
  }

  async clearAll() {
    // Explicit empty body
    return this._makeAuthRequest('delete', '/notifications/clear-all', {});
  }


  // ⚙️ Notification Event methods
  async getEvents() {
    try {
      const data = await this._makeAuthRequest('get', '/notifications/events');
      return data?.events || [];
    } catch (error) {
      if (error.isAuthError) throw error;
      return [];
    }
  }

  async getEventByKey(eventKey) {
    return this._makeAuthRequest('get', `/notifications/events/${eventKey}`);
  }

  async createEvent(data) {
    return this._makeAuthRequest('post', '/notifications/events', data);
  }

  async updateEvent(eventKey, data) {
    return this._makeAuthRequest('put', `/notifications/events/${eventKey}`, data);
  }

  async deleteEvent(eventKey) {
    return this._makeAuthRequest('delete', `/notifications/events/${eventKey}`);
  }

  async toggleEvent(eventKey, enabled) {
    return this._makeAuthRequest('patch', 
      `/notifications/events/${eventKey}/toggle`, 
      { enabled }
    );
  }
}

export default new NotificationsService();