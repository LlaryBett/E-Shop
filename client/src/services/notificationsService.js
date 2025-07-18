// services/notificationsService.js

import api from './api';

class NotificationsService {
  // 🔔 Notification methods
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data?.data?.notifications || [];
  }

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  }

  async getNotificationById(id) {
    const response = await api.get(`/notifications/${id}`);
    return response.data.notification;
  }

  async createNotification(data) {
    const response = await api.post('/notifications', data);
    return response.data.notification;
  }

  async markAsRead(id) {
    return api.patch(`/notifications/${id}/read`);
  }

  async markAllAsRead() {
    return api.patch('/notifications/read-all');
  }

  async bulkOperations(data) {
    return api.post('/notifications/bulk', data);
  }

  async deleteNotification(id) {
    return api.delete(`/notifications/${id}`);
  }

  async clearAll() {
    return api.delete('/notifications/clear-all');
  }

  // ⚙️ Notification Event methods (Corrected to match backend route: /api/notifications/events)
  async getEvents() {
    const response = await api.get('/notifications/events'); // ✅ Matches route
    return response.data?.events || [];
  }

  async getEventByKey(eventKey) {
    const response = await api.get(`/notifications/events/${eventKey}`);
    return response.data.event;
  }

  async createEvent(data) {
    const response = await api.post('/notifications/events', data);
    return response.data.event;
  }

  async updateEvent(eventKey, data) {
    const response = await api.put(`/notifications/events/${eventKey}`, data);
    return response.data.event;
  }

  async deleteEvent(eventKey) {
    return api.delete(`/notifications/events/${eventKey}`);
  }

  async toggleEvent(eventKey, enabled) {
    return api.patch(`/notifications/events/${eventKey}/toggle`, { enabled });
  }
}

export default new NotificationsService();
