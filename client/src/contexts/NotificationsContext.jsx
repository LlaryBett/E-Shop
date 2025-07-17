import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationsService from '../services/notificationsService';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  // Fetch notifications from backend
  useEffect(() => {
    setLoading(true);
    notificationsService.getNotifications()
      .then((data) => {
        // Handle backend response shape
        // If you see [] in NotificationsPage, it's likely notifications are not being set correctly here.
        // Add a debug log:
        console.log('notificationsService.getNotifications() response:', data);

        // Try all possible shapes
        if (data && data.data && Array.isArray(data.data.notifications)) {
          setNotifications(data.data.notifications);
        } else if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          setNotifications([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = async (id) => {
    await notificationsService.markAsRead(id);
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = async () => {
    await notificationsService.markAllAsRead();
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = async (id) => {
    await notificationsService.deleteNotification(id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = async () => {
    await notificationsService.clearAll();
    setNotifications([]);
  };

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Apply filter
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(notification => !notification.isRead);
      } else {
        filtered = filtered.filter(notification => notification.type === filter);
      }
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'oldest') {
        return new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortBy === 'unread') {
        return a.isRead - b.isRead;
      }
      return 0;
    });

    return filtered;
  };

  const value = {
    notifications,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getUnreadCount,
    getFilteredNotifications,
    loading
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};