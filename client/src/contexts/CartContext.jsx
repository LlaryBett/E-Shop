import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(`cart_${user?.id || 'guest'}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(`cart_${user?.id || 'guest'}`, JSON.stringify(items));
  }, [items, user]);

  // Sync cart when user logs in
  useEffect(() => {
    if (user) {
      const guestCart = localStorage.getItem('cart_guest');
      const userCart = localStorage.getItem(`cart_${user.id}`);
      
      if (guestCart && !userCart) {
        // Transfer guest cart to user cart
        const guestItems = JSON.parse(guestCart);
        setItems(guestItems);
        localStorage.removeItem('cart_guest');
        toast.success('Cart items transferred to your account');
      } else if (userCart) {
        // Load user's existing cart
        setItems(JSON.parse(userCart));
      }
    }
  }, [user]);

  const addToCart = (product, quantity = 1, variant) => {
    // Check stock availability
    if (product.stock < quantity) {
      toast.error('Not enough stock available');
      return;
    }

    const existingItem = items.find(item => 
      item.product.id === product.id && item.selectedVariant === variant
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        toast.error('Cannot add more items than available in stock');
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
  };

  const removeFromCart = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setItems(items.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = item.product.salePrice || item.product.price;
      return total + (price * item.quantity);
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