import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationsService from '../services/notificationsService';
import { useAuth } from './AuthContext'; // Import your auth context
import toast from 'react-hot-toast';

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Unified data loader with auth check
  const loadNotificationsData = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      setEventsLoading(true);
      setError(null);

      const [notifs, evts] = await Promise.all([
        notificationsService.getNotifications(),
        notificationsService.getEvents()
      ]);

      setNotifications(notifs || []);
      setEvents(evts || []);
    } catch (error) {
      if (!error.isAuthError) {
        setError('Failed to load notifications');
        toast.error('Failed to load notifications');
        console.error('Notifications error:', error);
      }
    } finally {
      setLoading(false);
      setEventsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load and auth change handler
  useEffect(() => {
    loadNotificationsData();
  }, [loadNotificationsData]);

  // Notification actions
  const markAsRead = async (id) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const clearAll = async () => {
    try {
      await notificationsService.clearAll();
      setNotifications([]);
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  // Event actions
  const createEvent = async (eventData) => {
    try {
      const newEvent = await notificationsService.createEvent(eventData);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      toast.error('Failed to create event');
      throw error;
    }
  };

  const updateEvent = async (eventKey, eventData) => {
    try {
      const updatedEvent = await notificationsService.updateEvent(eventKey, eventData);
      setEvents(prev =>
        prev.map(e => e.eventKey === eventKey ? updatedEvent : e)
      );
      return updatedEvent;
    } catch (error) {
      toast.error('Failed to update event');
      throw error;
    }
  };

  const deleteEvent = async (eventKey) => {
    try {
      await notificationsService.deleteEvent(eventKey);
      setEvents(prev => prev.filter(e => e.eventKey !== eventKey));
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const toggleEvent = async (eventKey, enabled) => {
    try {
      await notificationsService.toggleEvent(eventKey, enabled);
      setEvents(prev =>
        prev.map(e => e.eventKey === eventKey ? { ...e, enabled } : e)
      );
    } catch (error) {
      toast.error('Failed to toggle event');
    }
  };

  // Derived data
  const getUnreadCount = () => notifications.filter(n => !n.isRead).length;

  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    if (filter !== 'all') {
      filtered = filter === 'unread'
        ? filtered.filter(n => !n.isRead)
        : filtered.filter(n => n.type === filter);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortBy === 'unread') return a.isRead - b.isRead;
      return 0;
    });
  };

  const value = {
    notifications,
    events,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    loading,
    eventsLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleEvent,
    getUnreadCount,
    getFilteredNotifications,
    refresh: loadNotificationsData
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};