// 2. UPDATE YOUR EXISTING AuthContext - Add verification state and helpers
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
  // NEW: Add verification prompt state
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const isAuthenticated = !!user;
  // NEW: Add verification check
  const isVerified = user?.isVerified || false;

  useEffect(() => {
    const initializeAuth = async () => {
      if (!authService.isAuthenticated()) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getMe();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to fetch user on init:', err);
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
      return response;
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
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    }
  };

  // NEW: Add verification helper functions
  const handleVerificationRequired = () => {
    setShowVerificationPrompt(true);
  };

  const closeVerificationPrompt = () => {
    setShowVerificationPrompt(false);
  };

  const resendVerification = async () => {
    try {
      await authService.resendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    }
  };

  // UPDATED: Enhanced safeCall to check verification for checkout actions
  const safeCall = async (fn, requiresVerification = false, ...args) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to perform this action');
      return;
    }
    
    if (requiresVerification && !isVerified) {
      handleVerificationRequired();
      return;
    }
    
    return fn(...args);
  };

  const updateProfile = (updates) => {
    if (isAuthenticated) setUser((prev) => ({ ...prev, ...updates }));
  };

  const subscribeNewsletter = (email) => safeCall(userService.subscribeNewsletter, false, email);
  const submitContactForm = (formData) => safeCall(userService.submitContactForm, false, formData);
  const getAllContactMessages = () => safeCall(userService.getAllContactMessages, false);
  const updateContactMessageStatus = (id, status, replyContent) =>
    safeCall(userService.updateContactMessageStatus, false, id, status, replyContent);
  const deleteContactMessage = (id) => safeCall(userService.deleteContactMessage, false, id);

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
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    // NEW: Add verification-related values
    isVerified,
    showVerificationPrompt,
    handleVerificationRequired,
    closeVerificationPrompt,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
