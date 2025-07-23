import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, Sun, Moon, Bell, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useTheme } from '../../contexts/ThemeContext';
import ProductService from '../../services/productService';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { getTotalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Handle scroll effect with throttling for performance
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
        setIsSearchOpen(false);
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

  // Handle search with debouncing
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchLoading(true);
      try {
        const results = await ProductService.searchProducts(searchQuery);
        setSearchResults(results || []);
        navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  };

  const navItems = [
    { name: 'Home', path: '/', badge: null },
    { name: 'Shop', path: '/shop', badge: 'New' },
    { name: 'Categories', path: '/categories', badge: null },
    { name: 'About', path: '/about', badge: null },
    { name: 'Contact', path: '/contact', badge: null },
    { name: 'Blog', path: '/blog', badge: 'Hot' },
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-lg border-b border-gray-200/20 dark:border-gray-700/20' 
            : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md'
        }`}
        role="banner"
      >
        <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20">
            
            {/* Enhanced Logo - Responsive */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 sm:space-x-3 group shrink-0"
              aria-label="E-Shop Home"
            >
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-sm sm:text-lg md:text-xl">E</span>
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-yellow-800" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
              </div>
              <div className="hidden xs:block">
                <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  E-Shop
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 hidden sm:block">Premium Store</div>
              </div>
            </Link>

            {/* Desktop Navigation - Hidden on tablet and below */}
            <nav className="hidden xl:flex items-center space-x-1" role="navigation">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="relative px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 group"
                >
                  <span className="relative z-10">{item.name}</span>
                  {item.badge && (
                    <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                      item.badge === 'New' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </Link>
              ))}
            </nav>

            {/* Desktop Search Bar - Responsive width */}
            <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-xl mx-4 lg:mx-6 xl:mx-8">
              <form onSubmit={handleSearch} className="relative w-full group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 lg:px-6 lg:py-3 pl-10 lg:pl-12 pr-16 lg:pr-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300 hover:shadow-md focus:shadow-lg text-sm lg:text-base"
                  aria-label="Search products"
                />
                <Search className="absolute left-3 lg:left-4 top-2.5 lg:top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                <button
                  type="submit"
                  className="absolute right-1 lg:right-2 top-1 lg:top-2 px-2 lg:px-3 py-1 lg:py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md lg:rounded-lg text-xs lg:text-sm font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                  disabled={searchLoading}
                  aria-label="Search"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  setIsMobileMenuOpen(false);
                }}
                className="md:hidden p-2 sm:p-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg sm:rounded-xl transition-all duration-300"
                aria-label="Search"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-3 text-gray-700 dark:text-gray-300 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg sm:rounded-xl transition-all duration-300 group"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform duration-300" />
                )}
              </button>

              {/* Notifications - Hidden on smallest screens */}
              <button
                className="hidden xs:block relative p-2 sm:p-3 text-gray-700 dark:text-gray-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg sm:rounded-xl transition-all duration-300"
                onClick={() => navigate('/notifications')}
                type="button"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping"></span>
                <span className="absolute top-1 right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2 sm:p-3 text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg sm:rounded-xl transition-all duration-300 group"
                aria-label="Wishlist"
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center font-bold shadow-lg animate-bounce min-w-[16px] sm:min-w-[24px]">
                    {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 sm:p-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg sm:rounded-xl transition-all duration-300 group"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center font-bold shadow-lg animate-pulse min-w-[16px] sm:min-w-[24px]">
                    {getTotalItems() > 99 ? '99+' : getTotalItems()}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative" data-menu>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 p-2 sm:p-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg sm:rounded-xl transition-all duration-300 group"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md sm:rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="hidden lg:inline font-medium text-sm truncate max-w-[100px] xl:max-w-none">
                      {user?.name}
                    </span>
                    <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 animate-in slide-in-from-top-2 z-50">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm sm:text-base truncate">{user?.name}</p>
                            <p className="text-blue-100 text-xs sm:text-sm truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-1 sm:p-2">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg sm:rounded-xl transition-all duration-300 text-sm"
                        >
                          <User className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg sm:rounded-xl transition-all duration-300 text-sm"
                        >
                          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg sm:rounded-xl transition-all duration-300 text-sm"
                        >
                          <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Wishlist</span>
                        </Link>
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg sm:rounded-xl transition-all duration-300 text-sm"
                          >
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}
                        <hr className="my-1 sm:my-2 border-gray-200 dark:border-gray-700" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg sm:rounded-xl transition-all duration-300 text-sm"
                        >
                          <X className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link
                    to="/login"
                    className="hidden sm:inline-block px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-purple-700"
                  >
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Join</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsSearchOpen(false);
                }}
                className="xl:hidden p-2 sm:p-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg sm:rounded-xl transition-all duration-300"
                aria-label="Menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="md:hidden py-3 px-3 sm:px-4 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 pl-10 pr-16 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                  autoFocus
                  aria-label="Search products"
                />
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md text-xs font-medium transition-all duration-300"
                  disabled={searchLoading}
                  aria-label="Search"
                >
                  {searchLoading ? '...' : 'Go'}
                </button>
              </form>
            </div>
          )}

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="xl:hidden py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-4">
              <nav className="space-y-1" role="navigation">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-300"
                    onClick={closeMobileMenu}
                  >
                    <span className="font-medium text-sm sm:text-base">{item.name}</span>
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        item.badge === 'New' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                
                {/* Mobile Auth Buttons */}
                {!isAuthenticated && (
                  <div className="pt-3 space-y-2 border-t border-gray-200 dark:border-gray-700 mt-3">
                    <Link
                      to="/login"
                      className="block w-full px-3 sm:px-4 py-2 sm:py-3 text-center text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-sm"
                      onClick={closeMobileMenu}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full px-3 sm:px-4 py-2 sm:py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 text-sm"
                      onClick={closeMobileMenu}
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Backdrop for user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" 
          onClick={() => setShowUserMenu(false)}
          aria-hidden="true"
        />
      )}

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm xl:hidden" 
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Header;
