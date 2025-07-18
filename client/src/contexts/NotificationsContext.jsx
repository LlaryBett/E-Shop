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
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Fetch notifications from backend
  useEffect(() => {
    setLoading(true);
    notificationsService.getNotifications()
      .then((data) => {
        console.log('notificationsService.getNotifications() response:', data);

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
      .catch((err) => {
        console.error('Error fetching notifications:', err);
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch notification events
  useEffect(() => {
    setEventsLoading(true);
    notificationsService.getEvents()
      .then((res) => {
        // Adjust based on your API's response shape
        if (Array.isArray(res)) {
          setEvents(res);
        } else if (res && Array.isArray(res.events)) {
          setEvents(res.events);
        } else {
          setEvents([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
        setEvents([]);
      })
      .finally(() => setEventsLoading(false));
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

  const createEvent = async (eventData) => {
    const newEvent = await notificationsService.createEvent(eventData);
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = async (eventKey, eventData) => {
    const updatedEvent = await notificationsService.updateEvent(eventKey, eventData);
    setEvents(prev =>
      prev.map(event =>
        event.eventKey === eventKey ? updatedEvent : event
      )
    );
    return updatedEvent;
  };

  const deleteEvent = async (eventKey) => {
    await notificationsService.deleteEvent(eventKey);
    setEvents(prev => prev.filter(event => event.eventKey !== eventKey));
  };

  const toggleEvent = async (eventKey, enabled) => {
    await notificationsService.toggleEvent(eventKey, enabled);
    setEvents(prev =>
      prev.map(event =>
        event.eventKey === eventKey ? { ...event, enabled } : event
      )
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = filtered.filter(notification => !notification.isRead);
      } else {
        filtered = filtered.filter(notification => notification.type === filter);
      }
    }

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
    events,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    loading,
    eventsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleEvent,
    getUnreadCount,
    getFilteredNotifications
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
