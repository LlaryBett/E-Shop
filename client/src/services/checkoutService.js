import api from './api';

// Coupon endpoints
export const createCoupon = async (data) => {
  const res = await api.post('/config/coupons', data);
  return res.data;
};

export const getCoupons = async () => {
  const res = await api.get('/config/coupons');
  return res.data;
};

// Fees and Rates endpoints
export const setFeesAndRates = async (data) => {
  const res = await api.post('/config/fees', data);
  return res.data;
};

export const getFeesAndRates = async () => {
  const res = await api.get('/config/fees');
  return res.data;
};

// Tax Rates endpoints
export const createTaxRate = async (data) => {
  const res = await api.post('/config/tax-rates', data);
  return res.data;
};

export const getTaxRates = async () => {
  const res = await api.get('/config/tax-rates');
  return res.data;
};

// Shipping Methods endpoints
export const createShippingMethod = async (data) => {
  const res = await api.post('/config/shipping-methods', data);
  return res.data;
};

export const getShippingMethods = async () => {
  const res = await api.get('/config/shipping-methods');
  return res.data;
};

// All functions in this file return the .data property from the axios response.
// If you are not getting any data, check:
// 1. The backend endpoint is working and returns the expected data.
// 2. The frontend baseURL and endpoint paths are correct.
// 3. The backend sends a valid JSON response.
// 4. There are no network/auth errors.

// Example usage:
// const coupons = await getCoupons(); // Should return array of coupons if backend responds correctly

// Example test (put this in a component or a test file)
// import { getCoupons, getTaxRates, getShippingMethods } from './checkoutService';

// // In a React component, use useEffect:
// useEffect(() => {
//   async function testServices() {
//     try {
//       const coupons = await getCoupons();
//       console.log('Coupons:', coupons);

//       const taxRates = await getTaxRates();
//       console.log('Tax Rates:', taxRates);

//       const shippingMethods = await getShippingMethods();
//       console.log('Shipping Methods:', shippingMethods);
//     } catch (err) {
//       console.error('API error:', err);
//     }
//   }
//   testServices();
// }, []);

// Direct API URLs for browser testing:
// Coupons:           http://localhost:5000/config/coupons
// Tax Rates:         http://localhost:5000/config/tax-rates
// Shipping Methods:  http://localhost:5000/config/shipping-methods
// Fees & Rates:      http://localhost:5000/config/fees

// Paste these URLs in your browser address bar to see the raw JSON response from your backend.

