import api from './api'; // ✅ Uses the configured Axios instance

// Get wishlist for logged-in user
export const fetchWishlist = async () => {
  const res = await api.get('/wishlist');
  return res.data.items;
};

// Add a product to wishlist
// wishlistService.js
export const addToWishlist = async (productId) => {
  const res = await api.post('/wishlist', { productId }); // ✅ matches backend
  return res.data.items;
};


// Remove product from wishlist
export const removeFromWishlist = async (productId) => {
  const res = await api.delete(`/wishlist/${productId}`);
  return res.data.items;
};

// Clear all wishlist items (optional, if supported)
export const clearWishlist = async () => {
  const res = await api.delete('/wishlist');
  return res.data.message;
};
