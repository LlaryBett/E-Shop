// Notification service for API calls

import api from './api';

class NotificationsService {
  // Get list of notifications (supports pagination, filter, sort, search)
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    // The backend returns { success, data: { notifications: [...] } }
    // So return response.data.data.notifications
    return response.data?.data?.notifications || [];
  }

  // Get unread notifications count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  }

  // Get a single notification by ID
  async getNotificationById(id) {
    const response = await api.get(`/notifications/${id}`);
    return response.data.notification;
  }

  // Create a new notification
  async createNotification(data) {
    const response = await api.post('/notifications', data);
    return response.data.notification;
  }

  // Mark a single notification as read
  async markAsRead(id) {
    return api.patch(`/notifications/${id}/read`);
  }

  // Mark all notifications as read
  async markAllAsRead() {
    return api.patch('/notifications/read-all');
  }

  // Bulk operations: mark as read or delete
  async bulkOperations(data) {
    return api.post('/notifications/bulk', data);
  }

  // Delete a single notification
  async deleteNotification(id) {
    return api.delete(`/notifications/${id}`);
  }

  // Clear all notifications
  async clearAll() {
    return api.delete('/notifications/clear-all');
  }
}

export default new NotificationsService();
