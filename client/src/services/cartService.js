// src/services/cartService.js
import api from './api';

// Get the current user's cart
export const fetchCart = async () => {
  const res = await api.get('/cart', { withCredentials: true });
  return res.data;
};

// Add item to cart
export const addToCartAPI = async (productId, quantity = 1, variant = null) => {
  const res = await api.post('/cart', {
    productId,
    quantity,
    variant,
  }, { withCredentials: true });
  return res.data;
};

// Update the quantity of a cart item
export const updateCartItem = async (itemId, quantity) => {
  const res = await api.put(`/cart/${itemId}`, { quantity }, { withCredentials: true });
  return res.data;
};

// Remove a single item from cart
export const removeCartItem = async (itemId) => {
  const res = await api.delete(`/cart/${itemId}`, { withCredentials: true });
  return res.data;
};

// Clear the entire cart
export const clearCartAPI = async () => {
  const res = await api.delete('/cart', { withCredentials: true });
  return res.data;
};

// Proceed to checkout (place an order)
export const proceedToCheckout = async (checkoutPayload) => {
  const res = await api.post('/checkout', checkoutPayload, { withCredentials: true });
  return res.data;
};

