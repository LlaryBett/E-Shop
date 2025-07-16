import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

import {
  fetchCart,
  addToCartAPI,
  updateCartItem,
  removeCartItem,
  clearCartAPI
} from '../services/cartService';

const CartContext = createContext(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  // Load cart from backend or localStorage
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        try {
          const data = await fetchCart();
          const normalizedItems = data.items.map(item => ({
            ...item,
            id: item._id // normalize _id for frontend
          }));
          setItems(normalizedItems);
          console.log('[🟢 Cart Loaded]', normalizedItems);
        } catch (err) {
          console.error('[❌ Load Cart Error]', err);
          toast.error('Failed to load cart');
        }
      } else {
        const guestCart = localStorage.getItem('cart_guest');
        const parsed = guestCart ? JSON.parse(guestCart) : [];
        setItems(parsed);
        console.log('[🟢 Guest Cart Loaded]', parsed);
      }
    };

    loadCart();
  }, [user]);

  // Save guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart_guest', JSON.stringify(items));
    }
  }, [items, user]);

  const addToCart = async (product, quantity = 1, variant = null) => {
    if (product.stock < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    if (!user) {
      const existingItem = items.find(
        item => item.product.id === product.id && item.selectedVariant === variant
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error('Cannot exceed stock limit');
          return;
        }

        setItems(items.map(item =>
          item.id === existingItem.id
            ? { ...item, quantity: newQuantity }
            : item
        ));
      } else {
        const newItem = {
          id: `${product.id}-${variant || 'default'}-${Date.now()}`,
          product,
          quantity,
          selectedVariant: variant,
        };
        setItems([...items, newItem]);
      }

      toast.success(`${product.title} added to cart`);
      return;
    }

    try {
      await addToCartAPI(product._id, quantity, variant);
      const updated = await fetchCart();
      setItems(updated.items.map(item => ({ ...item, id: item._id })));
      toast.success(`${product.title} added to cart`);
    } catch (err) {
      console.error('[❌ Add to Cart Failed]', err);
      toast.error('Failed to add item to cart');
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!user) {
      if (quantity <= 0) {
        removeFromCart(itemId);
      } else {
        setItems(items.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        ));
      }
      return;
    }

    try {
      console.log('[🟡 Update Quantity]', { itemId, quantity });

      await updateCartItem(itemId, quantity);

      const updated = await fetchCart();
      const normalizedItems = updated.items.map(item => ({
        ...item,
        id: item._id
      }));
      setItems(normalizedItems);

      console.log('[✅ Quantity Updated]', normalizedItems);
    } catch (err) {
      console.error('[❌ Quantity Update Failed]', err.response?.data || err);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId) => {
    if (!user) {
      setItems(items.filter(item => item.id !== itemId));
      return;
    }

    try {
      await removeCartItem(itemId);
      const updated = await fetchCart();
      setItems(updated.items.map(item => ({ ...item, id: item._id })));
    } catch (err) {
      console.error('[❌ Remove from Cart Failed]', err);
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    if (!user) {
      setItems([]);
      localStorage.removeItem('cart_guest');
      return;
    }

    try {
      await clearCartAPI();
      setItems([]);
    } catch (err) {
      console.error('[❌ Clear Cart Failed]', err);
      toast.error('Failed to clear cart');
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = item.product.salePrice || item.product.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
