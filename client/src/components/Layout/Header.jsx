import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MapPin, User, Menu, X, ChevronDown, Sparkles, Grid3X3, Package, Apple, Home, Shirt, Smartphone, Gift, Star, Wallet, Sun, Moon, ChefHat, Milk, Clock, TrendingUp, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCategories } from '../../contexts/CategoryContext';
import userService from '../../services/userService';
import productService from '../../services/productService'; // Add this import

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [activeNavTab, setActiveNavTab] = useState(null);
  const [mouseInsideNavDropdown, setMouseInsideNavDropdown] = useState(false);
  
  // Search autocomplete states
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  // Refs
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileSearchDropdownRef = useRef(null);

  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { categories, loading: categoriesLoading } = useCategories();
  const navigate = useNavigate();
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState(null);

  // Icon mapping for dynamic icons
  const iconMap = {
    'ChefHat': ChefHat,
    'Milk': Milk,
    'Package': Package,
    'Apple': Apple,
    'Smartphone': Smartphone,
    'Shirt': Shirt,
    'Home': Home,
    'Star': Star,
    'Gift': Gift
  };

  // Helper function to get icon component
  const getIconComponent = (iconName) => {
    return iconMap[iconName] || Package;
  };

  // Fetch search suggestions from backend
  const fetchSearchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    try {
      const data = await productService.getSearchSuggestions(query, 8);
      setSearchSuggestions(data.suggestions || []);
      setShowSearchSuggestions(true);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        fetchSearchSuggestions(searchQuery);
      } else {
        setShowSearchSuggestions(false);
        setSearchSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle keyboard navigation in suggestions
  const handleSearchKeyDown = (e) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < searchSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : searchSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSearchSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.name || suggestion.title || suggestion.query);
    setShowSearchSuggestions(false);
    setSelectedSuggestionIndex(-1);
    
    // Navigate based on suggestion type
    if (suggestion.type === 'product') {
      navigate(`/product/${suggestion.slug || suggestion.id}`);
    } else if (suggestion.type === 'category') {
      navigate(`/shop?category=${suggestion.slug}`);
    } else {
      navigate(`/search?query=${encodeURIComponent(suggestion.name || suggestion.query)}`);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target) &&
          mobileSearchDropdownRef.current && !mobileSearchDropdownRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Transform API categories to match your existing structure
  const transformedCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) return {};
    
    const transformed = {};
    categories.forEach((category, index) => {
      const key = category._id || category.id || category.slug || index;
      transformed[key] = {
        ...category,
        name: category.name,
        icon: getIconComponent(category.icon),
        count: category.count || 0,
        description: category.description,
        slug: category.slug,
        isNavItem: category.isNavItem,
        navPosition: category.navPosition,
        navIcon: category.navIcon,
        subcategories: category.subcategories || []
      };
    });
    return transformed;
  }, [categories]);

  // Get navigation items (categories with isNavItem: true)
  const navItems = React.useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    return categories
      .filter(category => category.isNavItem)
      .sort((a, b) => (a.navPosition || 0) - (b.navPosition || 0))
      .map(category => ({
        name: category.name,
        path: `/shop?filter=${category.slug}`,
        icon: getIconComponent(category.navIcon || category.icon),
        slug: category.slug
      }));
  }, [categories]);

  // Set default active tab to first category when categories load
  useEffect(() => {
    if (categories && categories.length > 0 && activeTab === null) {
      const firstCategory = categories[0];
      setActiveTab(firstCategory._id || firstCategory.id || firstCategory.slug || 0);
    }
  }, [categories, activeTab]);

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
        setShowSearchSuggestions(false);
        setSelectedSuggestionIndex(-1);
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
      setShowSearchSuggestions(false);
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

  // Find category data for dropdown
  const getCategoryDataForNav = (navItemName) => {
    return categories?.find(cat => cat.name === navItemName) || null;
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
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-700 dark:text-gray-300"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>
              <button
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
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700" ref={mobileSearchDropdownRef}>
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    setShowSearchSuggestions(true);
                  }
                }}
                placeholder="Search for products..."
                className="w-full px-3 py-2 pl-9 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700"
                autoComplete="off"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              
              {/* Mobile Search Suggestions */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  <div className="p-1">
                    {searchSuggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={suggestion.id || index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full flex items-center space-x-2 px-3 py-2 text-left rounded-md transition-all duration-200 text-sm ${
                          selectedSuggestionIndex === index
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{suggestion.name || suggestion.title || suggestion.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Wallet + Cart Row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <Link 
              to="/wallet" 
              className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg group"
            >
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
                <div className="flex-1 max-w-2xl mx-4 lg:mx-8 hidden md:block" ref={searchDropdownRef}>
                  <form onSubmit={handleSearch} className="relative group">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => {
                        if (searchQuery.length >= 2) {
                          setShowSearchSuggestions(true);
                        }
                      }}
                      placeholder="Search products..."
                      className="w-full px-6 py-3 pl-12 pr-24 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:shadow-md focus:shadow-lg text-base"
                      aria-label="Search products"
                      autoComplete="off"
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

                    {/* Desktop Search Suggestions Dropdown */}
                    {showSearchSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                        <div className="p-2">
                          {searchSuggestions.map((suggestion, index) => (
                            <button
                              key={suggestion.id || index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                                selectedSuggestionIndex === index
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {/* Suggestion Icon */}
                              <div className="flex-shrink-0">
                                {suggestion.type === 'product' && suggestion.image ? (
                                  <img 
                                    src={suggestion.image} 
                                    alt={suggestion.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                    {suggestion.type === 'product' && <Package className="h-5 w-5 text-gray-500" />}
                                    {suggestion.type === 'category' && <Tag className="h-5 w-5 text-gray-500" />}
                                    {suggestion.type === 'search' && <Search className="h-5 w-5 text-gray-500" />}
                                  </div>
                                )}
                              </div>

                              {/* Suggestion Content */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {suggestion.name || suggestion.title || suggestion.query}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  {suggestion.category && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      in {suggestion.category}
                                    </span>
                                  )}
                                  {suggestion.price && (
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                      ${suggestion.price}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Suggestion Type Badge */}
                              <div className="flex-shrink-0">
                                {suggestion.type === 'product' && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                    Product
                                  </span>
                                )}
                                {suggestion.type === 'category' && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                    Category
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                      key={item.slug}
                      onMouseEnter={() => setActiveNavTab(item.name)}
                      onMouseLeave={handleNavMouseLeave}
                    >
                      <Link
                        to={`/shop?category=${item.slug}&name=${encodeURIComponent(item.name)}`}
                        className="flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300 tracking-widest"
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="uppercase text-xs">{item.name}</span>
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </Link>
                    </div>
                  ))}
                </nav>

                <div className="hidden lg:block flex-shrink-0">
                  <Link
                    to="/wallet"
                    className="flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-300 group"
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
              {showCategoriesMenu && !categoriesLoading && transformedCategories && Object.keys(transformedCategories).length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-96"
                  style={{ marginTop: '-1px' }}
                  onMouseEnter={() => setShowCategoriesMenu(true)}
                  onMouseLeave={() => setShowCategoriesMenu(false)}
                >
                  <div className="flex h-full">
                    <div className="w-1/5 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                      <div className="space-y-2">
                        {categories.map((category, index) => {
                          const key = category._id || category.id || category.slug || index;
                          return (
                            <button
                              key={key}
                              onMouseOver={() => setActiveTab(key)}
                              className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-all duration-200 ${
                                activeTab === key
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {React.createElement(getIconComponent(category.icon), { className: "h-5 w-5" })}
                              <div className="min-w-0">
                                <div className="font-medium text-sm">{category.name}</div>
                                <div className="text-xs text-gray-500">{category.count || 0} items</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                      {categories.map((category, index) => {
                        const key = category._id || category.id || category.slug || index;
                        const isActive = activeTab === key;
                        
                        return (
                          <div
                            key={key}
                            className={`${isActive ? 'block' : 'hidden'}`}
                          >
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {category.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {category.description}
                              </p>
                            </div>
                            {category.subcategories && category.subcategories.length > 0 ? (
                              <ul className="masonry" style={{ columnCount: Math.min(category.subcategories.length, 5) }}>
                                {category.subcategories.map((subcategory, subIndex) => (
                                  <li key={subcategory._id || subcategory.id || subIndex} className="mb-3 break-inside-avoid">
                                    <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">
                                      {subcategory.name}
                                    </div>
                                    {subcategory.items && subcategory.items.length > 0 && (
                                      <ul className="space-y-1">
                                        {subcategory.items.map((item, itemIndex) => (
                                          <li key={item._id || item.id || itemIndex} className="py-1">
                                            <Link
                                              to={`/shop?category=${category.slug}&subcategory=${item.slug}&name=${encodeURIComponent(item.name)}`}
                                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 block"
                                              onClick={() => {
                                                setActiveNavTab(null);
                                                setShowCategoriesMenu(false);
                                              }}
                                            >
                                              {item.name}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">No subcategories available</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Nav Items Mega Menu Dropdowns */}
              {activeNavTab && (
                <div 
                  className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80"
                  style={{ marginTop: '-1px' }}
                  onMouseEnter={() => handleDropdownMouseEnter(activeNavTab)}
                  onMouseLeave={handleDropdownMouseLeave}
                >
                  <div className="p-6 overflow-y-auto h-full">
                    {(() => {
                      const categoryData = getCategoryDataForNav(activeNavTab);
                      
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
                          {categoryData.subcategories && categoryData.subcategories.length > 0 && (
                            <ul className="masonry" style={{ columnCount: Math.min(categoryData.subcategories.length, 5) }}>
                              {categoryData.subcategories.map((subcategory, index) => (
                                <li key={subcategory._id || subcategory.id || index} className="mb-3 break-inside-avoid">
                                  <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-2">
                                    {subcategory.name}
                                  </div>
                                  {subcategory.items && subcategory.items.length > 0 && (
                                    <ul className="space-y-1">
                                      {subcategory.items.map((subItem, itemIndex) => (
                                        <li key={subItem._id || subItem.id || itemIndex} className="py-1">
                                          <Link
                                            to={`/shop?category=${categoryData.slug}&subcategory=${subItem.slug}&name=${encodeURIComponent(subItem.name)}`}
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
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No subcategories available</p>
                        </div>
                      );
                    })()}
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
          <div className="w-64 max-w-full bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col">
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
                  {mobileCategoriesOpen && !categoriesLoading && categories && (
                    <ul className="pl-6 pr-2 py-2 space-y-1">
                      {categories.map((category) => (
                        <li key={category._id || category.id || category.slug}>
                          <button
                            className="flex items-center w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600"
                            onClick={() =>
                              setMobileAccordionOpen(mobileAccordionOpen === category.slug ? null : category.slug)
                            }
                          >
                            {React.createElement(getIconComponent(category.icon), { className: "h-4 w-4 mr-2" })}
                            {category.name}
                            <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${mobileAccordionOpen === category.slug ? 'rotate-180' : ''}`} />
                          </button>
                          {mobileAccordionOpen === category.slug && category.subcategories && (
                            <ul className="pl-5 py-1 space-y-1">
                              {category.subcategories.map((subcategory, subIdx) => (
                                <li key={subcategory._id || subcategory.id || subIdx}>
                                  <div className="font-semibold text-xs text-blue-600 dark:text-blue-400 mb-1 mt-2">
                                    {subcategory.name}
                                  </div>
                                  {subcategory.items && subcategory.items.length > 0 && (
                                    <ul>
                                      {subcategory.items.map((item, itemIdx) => (
                                        <li key={item._id || item.id || itemIdx}>
                                          <Link
                                            to={`/shop?category=${category.slug}&subcategory=${item.slug}&name=${encodeURIComponent(item.name)}`}
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
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                {/* Dynamic nav items in mobile menu */}
                {navItems.map((item) => (
                  <li key={item.slug} className="border-b border-gray-200 dark:border-gray-700">
                    <Link
                      to={`/shop?category=${item.slug}&name=${encodeURIComponent(item.name)}`}
                      className="flex items-center px-6 py-3 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
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
        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
};

export default Header;