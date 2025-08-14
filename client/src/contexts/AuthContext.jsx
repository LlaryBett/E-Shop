import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';
import toast from 'react-hot-toast';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Just fetch from backend — cookies are sent automatically
        const currentUser = await authService.getMe();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authService.register({ name, email, password });
      setUser(response.user);
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout(); // Clears cookie in backend
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    }
  };

  const updateProfile = (updates) => {
    if (user) {
      setUser((prev) => ({ ...prev, ...updates }));
    }
  };

  const subscribeNewsletter = async (email) => {
    try {
      const response = await userService.subscribeNewsletter(email);
      toast.success(response.message || 'Subscribed successfully');
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Subscription failed');
      throw error;
    }
  };

  const submitContactForm = async (formData) => {
    try {
      const message = await userService.submitContactForm(formData);
      toast.success(message || 'Message sent successfully');
      return message;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Message failed to send');
      throw error;
    }
  };

  const getAllContactMessages = async () => {
    try {
      return await userService.getAllContactMessages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch messages');
      throw error;
    }
  };

  const updateContactMessageStatus = async (id, status, replyContent) => {
    try {
      const message = await userService.updateContactMessageStatus(id, status, replyContent);
      toast.success('Status updated');
      return message;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
      throw error;
    }
  };

  const deleteContactMessage = async (id) => {
    try {
      await userService.deleteContactMessage(id);
      toast.success('Message deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    subscribeNewsletter,
    submitContactForm,
    getAllContactMessages,
    updateContactMessageStatus,
    deleteContactMessage,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
