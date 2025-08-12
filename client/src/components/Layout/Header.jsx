import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MapPin, User, Menu, X, ChevronDown, Sparkles, Grid3X3, Package, Apple, Home, Shirt, Smartphone, Gift, Star, Wallet, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import userService from '../../services/userService';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [activeTab, setActiveTab] = useState(566); // Default to Promos
  const [activeNavTab, setActiveNavTab] = useState(null); // For navigation mega menus
  const [mouseInsideNavDropdown, setMouseInsideNavDropdown] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState(null);

  // Categories data structure for mega menu
  const categories = {
    566: {
      name: "Promos",
      icon: Star,
      count: 150,
      description: "Special offers and discounts on selected items",
      subcategories: [
        {
          name: "Flash Deals",
          items: [
            { name: "Electronics Sale", slug: "electronics-sale" },
            { name: "Fashion Week", slug: "fashion-week" },
            { name: "Home & Garden", slug: "home-garden" }
          ]
        },
        {
          name: "Seasonal Offers",
          items: [
            { name: "Summer Collection", slug: "summer-collection" },
            { name: "Back to School", slug: "back-to-school" },
            { name: "Holiday Specials", slug: "holiday-specials" }
          ]
        },
        {
          name: "Bundle Deals",
          items: [
            { name: "Tech Bundles", slug: "tech-bundles" },
            { name: "Beauty Sets", slug: "beauty-sets" },
            { name: "Family Packs", slug: "family-packs" }
          ]
        }
      ]
    },
    2138: {
      name: "Food Cupboard",
      icon: Package,
      count: 500,
      description: "Pantry essentials, snacks, and non-perishable items",
      subcategories: [
        {
          name: "Grains & Cereals",
          items: [
            { name: "Rice", slug: "rice" },
            { name: "Wheat Flour", slug: "wheat-flour" },
            { name: "Oats", slug: "oats" },
            { name: "Quinoa", slug: "quinoa" }
          ]
        },
        {
          name: "Canned Goods",
          items: [
            { name: "Tomatoes", slug: "canned-tomatoes" },
            { name: "Beans", slug: "canned-beans" },
            { name: "Tuna", slug: "canned-tuna" },
            { name: "Corn", slug: "canned-corn" }
          ]
        },
        {
          name: "Snacks",
          items: [
            { name: "Chips", slug: "chips" },
            { name: "Cookies", slug: "cookies" },
            { name: "Nuts", slug: "nuts" },
            { name: "Crackers", slug: "crackers" }
          ]
        },
        {
          name: "Beverages",
          items: [
            { name: "Coffee", slug: "coffee" },
            { name: "Tea", slug: "tea" },
            { name: "Juice", slug: "juice" },
            { name: "Soda", slug: "soda" }
          ]
        },
        {
          name: "Condiments",
          items: [
            { name: "Ketchup", slug: "ketchup" },
            { name: "Mustard", slug: "mustard" },
            { name: "Olive Oil", slug: "olive-oil" },
            { name: "Vinegar", slug: "vinegar" }
          ]
        }
      ]
    },
    3245: {
      name: "Fresh Food",
      icon: Apple,
      count: 200,
      description: "Fresh fruits, vegetables, meat, and dairy products",
      subcategories: [
        {
          name: "Fruits",
          items: [
            { name: "Apples", slug: "apples" },
            { name: "Bananas", slug: "bananas" },
            { name: "Oranges", slug: "oranges" },
            { name: "Berries", slug: "berries" }
          ]
        },
        {
          name: "Vegetables",
          items: [
            { name: "Spinach", slug: "spinach" },
            { name: "Carrots", slug: "carrots" },
            { name: "Broccoli", slug: "broccoli" },
            { name: "Tomatoes", slug: "fresh-tomatoes" }
          ]
        },
        {
          name: "Meat & Poultry",
          items: [
            { name: "Chicken", slug: "chicken" },
            { name: "Beef", slug: "beef" },
            { name: "Pork", slug: "pork" },
            { name: "Fish", slug: "fish" }
          ]
        },
        {
          name: "Dairy",
          items: [
            { name: "Milk", slug: "milk" },
            { name: "Cheese", slug: "cheese" },
            { name: "Yogurt", slug: "yogurt" },
            { name: "Butter", slug: "butter" }
          ]
        },
        {
          name: "Bakery",
          items: [
            { name: "Bread", slug: "bread" },
            { name: "Pastries", slug: "pastries" },
            { name: "Cakes", slug: "cakes" },
            { name: "Muffins", slug: "muffins" }
          ]
        }
      ]
    },
    4567: {
      name: "Electronics",
      icon: Smartphone,
      count: 300,
      description: "Latest gadgets, computers, and electronic devices",
      subcategories: [
        {
          name: "Smartphones",
          items: [
            { name: "iPhone", slug: "iphone" },
            { name: "Samsung Galaxy", slug: "samsung-galaxy" },
            { name: "Google Pixel", slug: "google-pixel" },
            { name: "OnePlus", slug: "oneplus" }
          ]
        },
        {
          name: "Computers",
          items: [
            { name: "Laptops", slug: "laptops" },
            { name: "Desktops", slug: "desktops" },
            { name: "Tablets", slug: "tablets" },
            { name: "Accessories", slug: "computer-accessories" }
          ]
        },
        {
          name: "Audio",
          items: [
            { name: "Headphones", slug: "headphones" },
            { name: "Speakers", slug: "speakers" },
            { name: "Earbuds", slug: "earbuds" },
            { name: "Sound Systems", slug: "sound-systems" }
          ]
        },
        {
          name: "Gaming",
          items: [
            { name: "PlayStation", slug: "playstation" },
            { name: "Xbox", slug: "xbox" },
            { name: "Nintendo", slug: "nintendo" },
            { name: "PC Gaming", slug: "pc-gaming" }
          ]
        },
        {
          name: "Smart Home",
          items: [
            { name: "Smart TV", slug: "smart-tv" },
            { name: "Smart Lights", slug: "smart-lights" },
            { name: "Security Cameras", slug: "security-cameras" },
            { name: "Smart Speakers", slug: "smart-speakers" }
          ]
        }
      ]
    },
    5678: {
      name: "Fashion",
      icon: Shirt,
      count: 400,
      description: "Clothing, shoes, and accessories for all occasions",
      subcategories: [
        {
          name: "Men's Clothing",
          items: [
            { name: "Shirts", slug: "mens-shirts" },
            { name: "Pants", slug: "mens-pants" },
            { name: "Suits", slug: "mens-suits" },
            { name: "Casual Wear", slug: "mens-casual" }
          ]
        },
        {
          name: "Women's Clothing",
          items: [
            { name: "Dresses", slug: "womens-dresses" },
            { name: "Tops", slug: "womens-tops" },
            { name: "Skirts", slug: "womens-skirts" },
            { name: "Formal Wear", slug: "womens-formal" }
          ]
        },
        {
          name: "Shoes",
          items: [
            { name: "Sneakers", slug: "sneakers" },
            { name: "Formal Shoes", slug: "formal-shoes" },
            { name: "Boots", slug: "boots" },
            { name: "Sandals", slug: "sandals" }
          ]
        },
        {
          name: "Accessories",
          items: [
            { name: "Bags", slug: "bags" },
            { name: "Watches", slug: "watches" },
            { name: "Jewelry", slug: "jewelry" },
            { name: "Belts", slug: "belts" }
          ]
        },
        {
          name: "Kids Fashion",
          items: [
            { name: "Boys Clothing", slug: "boys-clothing" },
            { name: "Girls Clothing", slug: "girls-clothing" },
            { name: "Kids Shoes", slug: "kids-shoes" },
            { name: "School Uniforms", slug: "school-uniforms" }
          ]
        }
      ]
    },
    6789: {
      name: "Home & Garden",
      icon: Home,
      count: 350,
      description: "Everything for your home, garden, and outdoor spaces",
      subcategories: [
        {
          name: "Furniture",
          items: [
            { name: "Living Room", slug: "living-room-furniture" },
            { name: "Bedroom", slug: "bedroom-furniture" },
            { name: "Dining Room", slug: "dining-room-furniture" },
            { name: "Office", slug: "office-furniture" }
          ]
        },
        {
          name: "Home Decor",
          items: [
            { name: "Wall Art", slug: "wall-art" },
            { name: "Lighting", slug: "lighting" },
            { name: "Rugs", slug: "rugs" },
            { name: "Curtains", slug: "curtains" }
          ]
        },
        {
          name: "Kitchen",
          items: [
            { name: "Cookware", slug: "cookware" },
            { name: "Appliances", slug: "kitchen-appliances" },
            { name: "Utensils", slug: "kitchen-utensils" },
            { name: "Storage", slug: "kitchen-storage" }
          ]
        },
        {
          name: "Garden",
          items: [
            { name: "Plants", slug: "plants" },
            { name: "Garden Tools", slug: "garden-tools" },
            { name: "Outdoor Furniture", slug: "outdoor-furniture" },
            { name: "Fertilizers", slug: "fertilizers" }
          ]
        },
        {
          name: "Cleaning",
          items: [
            { name: "Cleaning Supplies", slug: "cleaning-supplies" },
            { name: "Laundry", slug: "laundry" },
            { name: "Vacuum Cleaners", slug: "vacuum-cleaners" },
            { name: "Storage Solutions", slug: "storage-solutions" }
          ]
        }
      ]
    }
  };

  // Map navItems to shop route with filter
  const navItems = [
    { name: 'Promos', path: '/shop?filter=promos', icon: Star },
    { name: 'Food & Cupboard', path: '/shop?filter=food-cupboard', icon: Package },
    { name: 'Electronics', path: '/shop?filter=electronics', icon: Smartphone },
    { name: 'Home & Garden', path: '/shop?filter=home-garden', icon: Home },
    { name: 'Voucher', path: '/shop?filter=voucher', icon: Gift },
  ];

  // Handle scroll effect
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setShowUserMenu(false);
        setShowCategoriesMenu(false);
        setActiveNavTab(null);
        setMouseInsideNavDropdown(false);
      }
    };

    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-menu]')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchLoading(true);
      try {
        navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  // Fetch user addresses from backend and set default shipping address
  useEffect(() => {
    if (!isAuthenticated) {
      setDefaultAddress(null);
      return;
    }
    userService.getAddresses().then(addresses => {
      // addresses is an array, not an object
      const shippingAddresses = addresses?.filter(a => a.type === "shipping") || [];
      const foundDefault = shippingAddresses.find(a => a.isDefault) || shippingAddresses[0];
      setDefaultAddress(foundDefault);
    }).catch(() => setDefaultAddress(null));
  }, [isAuthenticated]);

  // Display city and country from fetched address, otherwise show empty string
  const deliverToLocation =
    defaultAddress && (defaultAddress.city || defaultAddress.country)
      ? [defaultAddress.city, defaultAddress.country].filter(Boolean).join(', ')
      : "";

  // Handler for nav mouse leave with delay
  const handleNavMouseLeave = () => {
    setTimeout(() => {
      if (!mouseInsideNavDropdown) {
        setActiveNavTab(null);
      }
    }, 150);
  };

  // Handlers for dropdown mouse events
  const handleDropdownMouseEnter = (tabName) => {
    setMouseInsideNavDropdown(true);
    setActiveNavTab(tabName);
  };

  const handleDropdownMouseLeave = () => {
    setMouseInsideNavDropdown(false);
    setActiveNavTab(null);
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg' 
            : 'bg-white dark:bg-gray-900 shadow-md'
        }`}
        role="banner"
      >
        {/* Mobile Header (only visible on small screens) */}
        <div className="lg:hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          {/* Top Row */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-700 dark:text-gray-300"
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link to="/" className="ml-2">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  E-Shop
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              {/* Theme Toggle Button (Mobile) */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-700 dark:text-gray-300"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>
              <button
                // Redirect to login or profile on mobile
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/profile');
                  } else {
                    navigate('/login');
                  }
                }}
                className="p-2 text-gray-700 dark:text-gray-300"
                aria-label="Account"
              >
                <User className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Location Row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium">Deliver to {deliverToLocation}</span>
            </div>
            <Link
              to="/profile?tab=addresses"
              className="text-sm text-blue-600 font-semibold"
            >
              Change
            </Link>
          </div>

          {/* Search Row */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full px-3 py-2 pl-9 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* Wallet + Cart Row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <Link to="/wallet" className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">KES 0.00</span>
            </Link>
            <Link to="/cart" className="relative p-2 text-gray-700 dark:text-gray-300">
              <ShoppingCart className="h-5 w-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Desktop Header (hidden on mobile) */}
        <div className="hidden lg:block">
          {/* Top Row */}
          <div className="border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-[1320px] mx-auto px-4 lg:px-6">
              <div className="flex items-center justify-between h-16 lg:h-20">
                <Link 
                  to="/" 
                  className="flex items-center space-x-2 group shrink-0"
                  aria-label="E-Shop Home"
                >
                  <div className="relative">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <span className="text-white font-bold text-xl lg:text-2xl">E</span>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Sparkles className="h-2 w-2 text-yellow-800" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
                  </div>
                  <div>
                    <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      E-Shop
                    </span>
                    <div className="text-sm text-gray-500 dark:text-gray-400 -mt-1 font-medium">Premium Store</div>
                  </div>
                </Link>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl mx-4 lg:mx-8 hidden md:block">
                  <form onSubmit={handleSearch} className="relative group">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full px-6 py-3 pl-12 pr-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:shadow-md focus:shadow-lg text-base"
                      aria-label="Search products"
                    />
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                    <button
                      type="submit"
                      className="absolute right-2 top-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-base font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                      disabled={searchLoading}
                      aria-label="Search"
                    >
                      {searchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </form>
                </div>

                {/* Theme Toggle Button (Desktop, Top Row) and Right Section */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 border border-transparent hover:border-blue-200"
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                  {/* Right Section - Account, Cart, etc. */}
                  <div className="hidden lg:flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-base">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          Deliver to
                          <Link
                            to="/profile?tab=addresses"
                            className="text-xs font-semibold bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 transition"
                          >
                            Change
                          </Link>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white text-base">
                          {deliverToLocation}
                        </div>
                      </div>
                    </div>

                    <div className="relative" data-menu>
                      {isAuthenticated ? (
                        <button
                          onClick={() => setShowUserMenu(!showUserMenu)}
                          className="flex items-center space-x-1.5 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 border border-transparent hover:border-blue-200"
                          aria-label="User menu"
                          aria-expanded={showUserMenu}
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md">
                            {user?.name?.charAt(0)?.toUpperCase() || 'L'}
                          </div>
                          <div className="text-base">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Welcome</div>
                            <div className="font-medium text-gray-900 dark:text-white">{user?.name || 'Larry'}</div>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowUserMenu(!showUserMenu)}
                          className="flex items-center space-x-1.5 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 border border-transparent hover:border-blue-200"
                          aria-label="Account menu"
                          aria-expanded={showUserMenu}
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="text-base">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Account</div>
                            <div className="font-medium text-gray-900 dark:text-white">Sign In</div>
                          </div>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      
                      {showUserMenu && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                          {isAuthenticated ? (
                            <>
                              <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'L'}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-base">{user?.name || 'Larry'}</p>
                                    <p className="text-blue-100 text-sm">{user?.email || 'user@example.com'}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="p-2">
                                {/* Admin Dashboard Link */}
                                {isAuthenticated && user?.role === 'admin' && (
                                  <Link
                                    to="/admin"
                                    onClick={() => setShowUserMenu(false)}
                                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-300"
                                  >
                                    <Grid3X3 className="h-5 w-5" />
                                    <span className="text-base">Admin Dashboard</span>
                                  </Link>
                                )}
                                <Link
                                  to="/profile"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300"
                                >
                                  <User className="h-5 w-5" />
                                  <span className="text-base">My Profile</span>
                                </Link>
                                <Link
                                  to="/orders"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-300"
                                >
                                  <ShoppingCart className="h-5 w-5" />
                                  <span className="text-base">My Orders</span>
                                </Link>
                                <Link
                                  to="/wishlist"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-all duration-300"
                                >
                                  <Star className="h-5 w-5" />
                                  <span className="text-base">My Wishlists</span>
                                </Link>
                                <Link
                                  to="/profile?tab=addresses"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all duration-300"
                                >
                                  <MapPin className="h-5 w-5" />
                                  <span className="text-base">My Addresses</span>
                                </Link>
                                <Link
                                  to="/wallet"
                                  onClick={() => setShowUserMenu(false)}
                                  className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-300"
                                >
                                  <Wallet className="h-5 w-5" />
                                  <span className="text-base">My Wallet</span>
                                </Link>
                                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                                <button
                                  onClick={handleLogout}
                                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-300"
                                >
                                  <X className="h-5 w-5" />
                                  <span className="text-base">Sign Out</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="p-4">
                              <div className="space-y-2">
                                <Link
                                  to="/login"
                                  onClick={() => setShowUserMenu(false)}
                                  className="block w-full px-4 py-3 text-center text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-base"
                                >
                                  Sign In
                                </Link>
                                <Link
                                  to="/register"
                                  onClick={() => setShowUserMenu(false)}
                                  className="block w-full px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-base"
                                >
                                  Get Started
                                </Link>
                              </div>
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                  Sign in to access your account, orders, and saved items
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Link
                      to="/cart"
                      className="relative flex items-center space-x-1.5 p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 group border border-transparent hover:border-blue-200"
                      aria-label="Shopping cart"
                    >
                      <ShoppingCart className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                      <div className="text-base">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Cart</div>
                        <div className="font-medium">{getTotalItems()} items</div>
                      </div>
                      {getTotalItems() > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse min-w-[24px]">
                          {getTotalItems() > 99 ? '99+' : getTotalItems()}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Navigation with Categories */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-[1320px] mx-auto px-4 lg:px-6">
              <div className="flex items-center justify-between h-16 relative">
                <div 
                  className="flex-shrink-0 relative"
                  onMouseEnter={() => setShowCategoriesMenu(true)}
                  onMouseLeave={() => setShowCategoriesMenu(false)}
                >
                  <button
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 font-medium text-sm tracking-widest"
                    aria-label="Categories"
                    aria-expanded={showCategoriesMenu}
                  >
                    <Grid3X3 className="h-5 w-5" />
                    <span className="uppercase">Categories</span>
                    <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${showCategoriesMenu ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-center" role="navigation">
                  {navItems.map((item) => (
                    <div 
                      key={item.name}
                      onMouseEnter={() => setActiveNavTab(item.name)}
                      onMouseLeave={handleNavMouseLeave}
                    >
                      <Link
                        to={item.path}
                        className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 tracking-widest"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="uppercase text-xs">{item.name}</span>
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </Link>
                    </div>
                  ))}
                  <div
                    onMouseEnter={() => setActiveNavTab('Fashion')}
                    onMouseLeave={handleNavMouseLeave}
                  >
                    <Link
                      to="/shop?filter=fashion"
                      className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 tracking-widest"
                    >
                      <Shirt className="h-4 w-4" />
                      <span className="uppercase text-xs">Fashion</span>
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </Link>
                  </div>
                </nav>

                <div className="hidden lg:block flex-shrink-0">
                  <Link
                    to="/wallet"
                    className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-300 group"
                    aria-label="Wallet"
                  >
                    <Wallet className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                    <div className="text-sm">
  <div className="text-xs text-green-600 dark:text-green-500">Wallet Bal</div>
  <div className="font-semibold text-base">KES 0.00</div>
</div>

                  </Link>
                </div>
              </div>

              {/* Categories Mega Menu Dropdown */}
              {showCategoriesMenu && (
                <div 
                  className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  style={{ marginTop: '-1px' }}
                  onMouseEnter={() => setShowCategoriesMenu(true)}
                  onMouseLeave={() => setShowCategoriesMenu(false)}
                >
                  <div className="flex">
                    <div className="w-1/5 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
                      <div className="space-y-2">
                        {Object.entries(categories).map(([id, category]) => (
                          <button
                            key={id}
                            onMouseOver={() => setActiveTab(parseInt(id))}
                            className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-all duration-200 ${
                              activeTab === parseInt(id)
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <category.icon className="h-5 w-5" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{category.name}</div>
                              <div className="text-xs text-gray-500">{category.count} items</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      {Object.entries(categories).map(([id, category]) => (
                        <div
                          key={id}
                          className={`${activeTab === parseInt(id) ? 'block' : 'hidden'}`}
                        >
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {category.description}
                            </p>
                          </div>
                          <ul className="masonry" style={{ columnCount: 5 }}>
                            {category.subcategories.map((subcategory, index) => (
                              <li key={index} className="mb-3 break-inside-avoid">
                                <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">
                                  {subcategory.name}
                                </div>
                                <ul className="space-y-1">
                                  {subcategory.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="py-1">
                                      <Link
                                        to={`/category/${item.slug}`}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block"
                                        onClick={() => setShowCategoriesMenu(false)}
                                      >
                                        {item.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Items Mega Menu Dropdowns */}
              {activeNavTab && activeNavTab !== 'Fashion' && (
                <div 
                  className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  style={{ marginTop: '-1px' }}
                  onMouseEnter={() => handleDropdownMouseEnter(activeNavTab)}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <div className="p-6">
                    {(() => {
                      let categoryData;
                      if (activeNavTab === 'Promos') categoryData = categories[566];
                      else if (activeNavTab === 'Food & Cupboard') categoryData = categories[2138];
                      else if (activeNavTab === 'Electronics') categoryData = categories[4567];
                      else if (activeNavTab === 'Home & Garden') categoryData = categories[6789];
                      else if (activeNavTab === 'Voucher') {
                        categoryData = {
                          name: "Vouchers & Gift Cards",
                          description: "Digital vouchers and gift cards for all occasions",
                          subcategories: [
                            {
                              name: "Shopping Vouchers",
                              items: [
                                { name: "Electronics Vouchers", slug: "electronics-vouchers" },
                                { name: "Fashion Vouchers", slug: "fashion-vouchers" },
                                { name: "Food Vouchers", slug: "food-vouchers" },
                                { name: "General Shopping", slug: "general-vouchers" }
                              ]
                            },
                            {
                              name: "Gift Cards",
                              items: [
                                { name: "Birthday Cards", slug: "birthday-cards" },
                                { name: "Holiday Cards", slug: "holiday-cards" },
                                { name: "Anniversary Cards", slug: "anniversary-cards" },
                                { name: "Custom Cards", slug: "custom-cards" }
                              ]
                            },
                            {
                              name: "Digital Codes",
                              items: [
                                { name: "Gaming Codes", slug: "gaming-codes" },
                                { name: "App Store Credits", slug: "app-store-credits" },
                                { name: "Streaming Services", slug: "streaming-vouchers" },
                                { name: "Online Services", slug: "online-services" }
                              ]
                            }
                          ]
                        };
                      }

                      return categoryData ? (
                        <>
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {categoryData.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {categoryData.description}
                            </p>
                          </div>
                          <ul className="masonry" style={{ columnCount: 5 }}>
                            {categoryData.subcategories.map((subcategory, index) => (
                              <li key={index} className="mb-3 break-inside-avoid">
                                <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">
                                  {subcategory.name}
                                </div>
                                <ul className="space-y-1">
                                  {subcategory.items.map((subItem, itemIndex) => (
                                    <li key={itemIndex} className="py-1">
                                      <Link
                                        to={`/category/${subItem.slug}`}
                                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block"
                                        onClick={() => {
                                          setActiveNavTab(null);
                                          setMouseInsideNavDropdown(false);
                                        }}
                                      >
                                        {subItem.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* Fashion Mega Menu Dropdown */}
              {activeNavTab === 'Fashion' && (
                <div 
                  className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  style={{ marginTop: '-1px' }}
                  onMouseEnter={() => handleDropdownMouseEnter('Fashion')}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {categories[5678].name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {categories[5678].description}
                      </p>
                    </div>
                    <ul className="masonry" style={{ columnCount: 5 }}>
                      {categories[5678].subcategories.map((subcategory, index) => (
                        <li key={index} className="mb-3 break-inside-avoid">
                          <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">
                            {subcategory.name}
                          </div>
                          <ul className="space-y-1">
                            {subcategory.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="py-1">
                                <Link
                                  to={`/category/${item.slug}`}
                                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block"
                                  onClick={() => {
                                    setActiveNavTab(null);
                                    setMouseInsideNavDropdown(false);
                                  }}
                                >
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                        </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

     {/* Mobile Hamburger Menu Drawer */}
{isMobileMenuOpen && (
  <div className="fixed inset-0 z-50 flex">
    {/* Drawer */}
    <div className="w-80 max-w-full bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Menu
        </span>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 text-gray-700 dark:text-gray-300"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-2">
          <li className="border-b border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className="flex items-center px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="h-5 w-5 mr-3" />
              Home
            </Link>
          </li>
          <li className="border-b border-gray-200 dark:border-gray-700">
            <button
              className="flex items-center w-full px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => setMobileCategoriesOpen((v) => !v)}
            >
              <Grid3X3 className="h-5 w-5 mr-3" />
              Categories
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileCategoriesOpen && (
              <ul className="pl-6 pr-2 py-2 space-y-1">
                {Object.entries(categories).map(([id, category]) => (
                  <li key={id}>
                    <button
                      className="flex items-center w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600"
                      onClick={() =>
                        setMobileAccordionOpen(mobileAccordionOpen === id ? null : id)
                      }
                    >
                      <category.icon className="h-4 w-4 mr-2" />
                      {category.name}
                      <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${mobileAccordionOpen === id ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileAccordionOpen === id && (
                      <ul className="pl-5 py-1 space-y-1">
                        {category.subcategories.map((subcategory, subIdx) => (
                          <li key={subIdx}>
                            <div className="font-semibold text-xs text-blue-600 dark:text-blue-400 mb-1 mt-2">
                              {subcategory.name}
                            </div>
                            <ul>
                              {subcategory.items.map((item, itemIdx) => (
                                <li key={itemIdx}>
                                  <Link
                                    to={`/category/${item.slug}`}
                                    className="block py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    onClick={() => {
                                      setIsMobileMenuOpen(false);
                                      setMobileCategoriesOpen(false);
                                      setMobileAccordionOpen(null);
                                    }}
                                  >
                                    {item.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
          {/* Other nav items */}
          {navItems.map((item) => (
            <li key={item.name} className="border-b border-gray-200 dark:border-gray-700">
              <Link
                to={item.path}
                className="flex items-center px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </li>
          ))}
          <li className="border-b border-gray-200 dark:border-gray-700">
            <Link
              to="/shop?filter=fashion"
              className="flex items-center px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Shirt className="h-5 w-5 mr-3" />
              Fashion
            </Link>
          </li>
        </ul>
      </nav>
      {/* Optional: Add sign in/out/profile links here for mobile */}
    </div>
    {/* Overlay */}
    <div
      className="flex-1 bg-black/20 backdrop-blur-sm"
      onClick={() => setIsMobileMenuOpen(false)}
    />
  </div>
)}


      {/* Backdrop for user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Header;