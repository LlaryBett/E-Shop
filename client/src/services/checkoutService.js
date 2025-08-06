import api from './api';
import AuthService from './authService'; // Import your AuthService

// Coupon endpoints (Protected)
export const createCoupon = async (data) => {
  if (!AuthService.isAuthenticated()) throw new Error('Authentication required');
  const res = await api.post('/config/coupons', data);
  return res.data;
};

export const getCoupons = async () => {
  if (!AuthService.isAuthenticated()) return [];
  try {
    const res = await api.get('/config/coupons');
    return res.data;
  } catch (error) {
    if (error.response?.status === 401) {
      AuthService.logout(); // Force logout if token is invalid
    }
    return []; // Return empty array on error
  }
};

// Fees and Rates endpoints (Protected)
export const setFeesAndRates = async (data) => {
  if (!AuthService.isAuthenticated()) throw new Error('Authentication required');
  const res = await api.post('/config/fees', data);
  return res.data;
};

export const getFeesAndRates = async () => {
  if (!AuthService.isAuthenticated()) return null;
  try {
    const res = await api.get('/config/fees');
    return res.data;
  } catch (error) {
    if (error.response?.status === 401) {
      AuthService.logout();
    }
    return null;
  }
};

// Tax Rates endpoints (Protected)
export const createTaxRate = async (data) => {
  if (!AuthService.isAuthenticated()) throw new Error('Authentication required');
  const res = await api.post('/config/tax-rates', data);
  return res.data;
};

export const getTaxRates = async () => {
  if (!AuthService.isAuthenticated()) return [];
  try {
    const res = await api.get('/config/tax-rates');
    return res.data;
  } catch (error) {
    if (error.response?.status === 401) {
      AuthService.logout();
    }
    return [];
  }
};

// Shipping Methods endpoints (Public)
export const createShippingMethod = async (data) => {
  if (!AuthService.isAuthenticated()) throw new Error('Authentication required');
  const res = await api.post('/config/shipping-methods', data);
  return res.data;
};

export const getShippingMethods = async () => {
  try {
    const res = await api.get('/config/shipping-methods');
    return res.data || [];
  } catch (error) {
    console.error('Failed to load shipping methods:', error);
    return []; // Return empty array even if error occurs
  }
};