import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  fetchWishlist,
  addToWishlist as addToWishlistAPI,
  removeFromWishlist as removeFromWishlistAPI,
  clearWishlist as clearWishlistAPI
} from '../services/wishlistService';

const WishlistContext = createContext(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  // Load wishlist from API on mount
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const data = await fetchWishlist();
        setItems(data);
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      }
    };
    loadWishlist();
  }, []);

  const addToWishlist = async (product) => {
    try {
      const updated = await addToWishlistAPI(product.id);
      setItems(updated);
    } catch (err) {
      console.error('Add to wishlist failed:', err);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const updated = await removeFromWishlistAPI(productId);
      setItems(updated);
    } catch (err) {
      console.error('Remove from wishlist failed:', err);
    }
  };

  const clearWishlist = async () => {
    try {
      await clearWishlistAPI();
      setItems([]);
    } catch (err) {
      console.error('Clear wishlist failed:', err);
    }
  };

  const isInWishlist = (id) => {
    return items.some(item => item._id === id || item.id === id);
  };

  const value = {
    items,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
