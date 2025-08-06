import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import wishlistService from '../services/wishlistService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await wishlistService.fetchWishlist();
      setItems(data);
    } catch (error) {
      if (!error.isAuthError) {
        setError('Failed to load wishlist');
        toast.error('Failed to load wishlist');
        console.error('Wishlist error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const addToWishlist = async (product) => {
    try {
      const updated = await wishlistService.addToWishlist(product.id);
      setItems(updated);
      toast.success('Added to wishlist');
    } catch (error) {
      if (!error.isAuthError) {
        toast.error('Failed to add to wishlist');
      }
      throw error;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const updated = await wishlistService.removeFromWishlist(productId);
      setItems(updated);
      toast.success('Removed from wishlist');
    } catch (error) {
      if (!error.isAuthError) {
        toast.error('Failed to remove from wishlist');
      }
    }
  };

  const clearWishlist = async () => {
    try {
      await wishlistService.clearWishlist();
      setItems([]);
      toast.success('Wishlist cleared');
    } catch (error) {
      if (!error.isAuthError) {
        toast.error('Failed to clear wishlist');
      }
    }
  };

  const isInWishlist = (id) => {
    return items.some(item => item._id === id || item.id === id);
  };

  const value = {
    items,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    refreshWishlist: loadWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};