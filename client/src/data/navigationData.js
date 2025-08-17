import { Star, Package, Apple, Smartphone, Home, Shirt, Gift } from 'lucide-react';

export const navItems = [
  { name: 'Promos', path: '/shop?filter=promos', icon: Star },
  { name: 'Food & Cupboard', path: '/shop?filter=food-cupboard', icon: Package },
  { name: 'Electronics', path: '/shop?filter=electronics', icon: Smartphone },
  { name: 'Home & Garden', path: '/shop?filter=home-garden', icon: Home },
  { name: 'Voucher', path: '/shop?filter=voucher', icon: Gift },
];

export const categories = {
  566: {
    name: "Promos",
    icon: Star,
    count: 150,
    description: "Special offers and discounts on selected items",
    subcategories: [
      // ... Copy all subcategories data from Header.jsx here ...
    ]
  },
  2138: {
    name: "Food Cupboard",
    icon: Package,
    count: 500,
    description: "Pantry essentials, snacks, and non-perishable items",
    subcategories: [
      // ... Copy all subcategories data from Header.jsx here ...
    ]
  },
  3245: {
    name: "Fresh Food",
    icon: Apple,
    count: 200,
    description: "Fresh fruits, vegetables, meat, and dairy products",
    subcategories: [
      // ... Copy all subcategories data from Header.jsx here ...
    ]
  },
  4567: {
    name: "Electronics",
    icon: Smartphone,
    count: 300,
    description: "Latest gadgets, computers, and electronic devices",
    subcategories: [
      // ... Copy all subcategories data from Header.jsx here ...
    ]
  },
  5678: {
    name: "Fashion",
    icon: Shirt,
    count: 400,
    description: "Clothing, shoes, and accessories for all occasions",
    subcategories: [
      // ... Copy all subcategories data from Header.jsx here ...
    ]
  },
  6789: {
    name: "Home & Garden",
    icon: Home,
    count: 350,
    description: "Everything for your home, garden, and outdoor spaces",
    subcategories: [
      // ... Copy all subcategories data from Header.jsx here ...
    ]
  }
};
