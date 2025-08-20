import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Edit3, Plus, Trash2, Bell, ShoppingBag, Heart, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useWishlist } from '../contexts/WishlistContext'; // Add this import
import toast from 'react-hot-toast';
import userService from '../services/userService';
import { useLocation, useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout } = useAuth();
  const { items } = useWishlist(); // Add this hook
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const fileInputRef = useRef(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Define the tabs array that was missing
  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Edit3 },
  ];

  // Initialize from user context, but update from backend on mount
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    role: user?.role || '',
  });

  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Replace local notifications state with context
  const { 
    getFilteredNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    loading: notificationsLoading, 
    filter, 
    setFilter,
    sortBy,
    setSortBy,
    refresh: refreshNotifications
  } = useNotifications();

  // Add getter for unread notifications count
  const unreadNotificationsCount = getFilteredNotifications()?.filter(n => !n.isRead)?.length || 0;
  
  // Update getter to use items from wishlist context
  const wishlistItemsCount = items?.length || 0;

  useEffect(() => {
    // If user context is updated after refresh, update state
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
      role: user?.role || '',
    });
    setAddresses(user?.addresses || []);
  }, [user]);

  useEffect(() => {
    // Fetch addresses from backend (in case user context is not up-to-date)
    userService.getAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
    // Optionally, fetch profile data from backend and update profileData here if needed
  }, []);

  // Open addresses tab if navigated with /profile?tab=addresses
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'addresses') {
      setActiveTab('addresses');
    }
  }, [location.search]);

  useEffect(() => {
    // Fetch notifications if notifications tab is active
    if (activeTab === 'notifications') {
      refreshNotifications();
     
    }
  }, [activeTab, refreshNotifications]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await userService.updateProfile(profileData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  // Address CRUD with backend
  const handleAddressSubmit = async (addressData) => {
    try {
      if (editingAddress) {
        const updated = await userService.updateAddress(editingAddress._id || editingAddress.id, addressData);
        setAddresses(prev => prev.map(addr =>
          (addr._id || addr.id) === (editingAddress._id || editingAddress.id) ? updated : addr
        ));
        toast.success('Address updated successfully!');
      } else {
        const newAddress = await userService.addAddress(addressData);
        setAddresses(prev => [...prev, newAddress]);
        toast.success('Address added successfully!');
      }
    } catch {
      toast.error('Failed to save address');
    }
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = async (id) => {
    try {
      await userService.deleteAddress(id);
      setAddresses(prev => prev.filter(addr => (addr._id || addr.id) !== id));
      toast.success('Address deleted successfully!');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const avatarUrl = await userService.uploadAvatar(file);
      setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
      toast.success('Profile image updated!');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>;
      case 'system':
        return <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
      case 'price':
        return <div className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>;
      default:
        return <div className="p-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full"><Bell className="w-5 h-5" /></div>;
    }
  };

  // Format time utility function
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 86400000 * 7) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-8">
        {/* Mobile Header - only shown on small screens */}
        <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=3B82F6&color=fff`}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover mx-auto"
                onClick={() => setShowAvatarModal(true)}
                style={{ cursor: 'pointer' }}
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isLoading}
              >
                <Camera className="h-3 w-3" />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
                disabled={isLoading}
              />
            </div>
            <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{profileData.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{profileData.email}</p>
          </div>
        </div>

        {/* Avatar Modal for mobile */}
        {showAvatarModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
            onClick={() => setShowAvatarModal(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center relative"
              style={{ minWidth: 220 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={() => setShowAvatarModal(false)}
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=3B82F6&color=fff`}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover mb-4"
              />
              <button
                type="button"
                className="flex flex-col items-center justify-center bg-blue-600 text-white rounded-full p-4 hover:bg-blue-700 transition-colors focus:outline-none"
                onClick={() => {
                  setShowAvatarModal(false);
                  fileInputRef.current && fileInputRef.current.click();
                }}
                disabled={isLoading}
                aria-label="Change profile image"
              >
                <Camera className="h-8 w-8" />
                <span className="mt-2 text-xs font-medium">Change Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Title - hidden on mobile */}
        <h1 className="hidden lg:block text-3xl font-bold text-gray-900 dark:text-white mb-8">My Account</h1>

        <div className="flex lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Mobile Icon Sidebar - Only icons on mobile */}
          <div className="lg:hidden w-16 bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 mr-4 h-fit">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full p-3 rounded-lg transition-colors flex items-center justify-center relative ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title={tab.label}
                  >
                    <Icon className="h-5 w-5" />
                    {/* Add notification badge */}
                    {tab.id === 'notifications' && unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                );
              })}
              {/* --- Additional mobile-only icon buttons --- */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full p-3 rounded-lg transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Admin Dashboard"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => navigate('/orders')}
                className="w-full p-3 rounded-lg transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Orders"
              >
                <ShoppingBag className="h-5 w-5" />
              </button>

              {/* Wishlist button with badge */}
              <button
                onClick={() => navigate('/wishlist')}
                className="w-full p-3 rounded-lg transition-colors flex items-center justify-center relative text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Wishlists"
              >
                <Heart className="h-5 w-5" />
                {wishlistItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistItemsCount > 9 ? '9+' : wishlistItemsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full p-3 rounded-lg transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </nav>
          </div>

          {/* Desktop Sidebar - Only shown on large screens */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={profileData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=3B82F6&color=fff`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={isLoading}
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                    disabled={isLoading}
                  />
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{profileData.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{profileData.email}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {profileData.phone
                    ? profileData.phone.replace(/^(\d{4})\d{4}(\d{2})$/, '$1****$2')
                    : ''}
                </p>
              </div>

              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content - Responsive width */}
          <div className="flex-1 lg:col-span-3">
            {/* Profile Information */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                    <span className="lg:hidden">Profile</span>
                    <span className="hidden lg:inline">Profile Information</span>
                  </h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-2 px-3 lg:px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="hidden sm:inline">{isEditing ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                <form onSubmit={handleProfileUpdate}>
                  <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={
                          !isEditing && profileData.phone
                            ? profileData.phone.replace(/^(\d{4})\d{4}(\d{2})$/, '$1****$2')
                            : profileData.phone
                        }
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={user?.role || 'Customer'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white capitalize"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Addresses */}
            {activeTab === 'addresses' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4 lg:mb-6">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                    <span className="lg:hidden">Addresses</span>
                    <span className="hidden lg:inline">Saved Addresses</span>
                  </h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center space-x-2 px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>

                <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {addresses.map(address => (
                    <div key={address._id || address.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            address.type === 'shipping' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {address.type}
                          </span>
                          {address.isDefault && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingAddress(address);
                              setShowAddressForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address._id || address.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {address.firstName} {address.lastName}
                        </p>
                        <p>{address.address}</p>
                        <p>{address.city}, {address.state} {address.zipCode}</p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Address Form Modal */}
                {showAddressForm && (
                  <AddressForm
                    address={editingAddress}
                    onSubmit={handleAddressSubmit}
                    onCancel={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                  />
                )}
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2 lg:p-6 w-full max-w-full overflow-hidden box-border">
    <div className="mb-3 lg:mb-6 w-full max-w-full overflow-hidden">
      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">
        Notifications
      </h2>
      
      {/* Mobile-responsive controls */}
      <div className="space-y-2 lg:space-y-0 lg:flex lg:items-center lg:justify-between w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-1 lg:gap-4 w-full max-w-full overflow-hidden box-border">
          <div className="flex items-center gap-1 flex-1 min-w-0 max-w-[48%] box-border">
            <label htmlFor="notification-filter" className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 shrink-0">
              Filter:
            </label>
            <select 
              id="notification-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 text-xs lg:text-sm border border-gray-300 dark:border-gray-600 rounded py-0.5 px-1 lg:py-1.5 lg:px-2 dark:bg-gray-700 dark:text-white min-w-0 w-full box-border"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="order">Orders</option>
              <option value="system">System</option>
              <option value="price">Price Alerts</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1 flex-1 min-w-0 max-w-[48%] box-border">
            <label htmlFor="notification-sort" className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 shrink-0">
              Sort:
            </label>
            <select 
              id="notification-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 text-xs lg:text-sm border border-gray-300 dark:border-gray-600 rounded py-0.5 px-1 lg:py-1.5 lg:px-2 dark:bg-gray-700 dark:text-white min-w-0 w-full box-border"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="unread">Unread first</option>
            </select>
          </div>
        </div>
        
        {/* Mark all as read button */}
        <button
          onClick={markAllAsRead}
          className="w-full lg:w-auto text-xs lg:text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 lg:py-0 text-center lg:text-left"
        >
          Mark all as read
        </button>
      </div>
    </div>

    {notificationsLoading ? (
      <div className="flex justify-center py-6 lg:py-8">
        <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-blue-600"></div>
      </div>
    ) : getFilteredNotifications().length === 0 ? (
      <div className="text-center py-6 lg:py-8 text-gray-500 dark:text-gray-400">
        <Bell className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-sm lg:text-base">You don't have any notifications yet.</p>
      </div>
    ) : (
      <div className="space-y-2 lg:space-y-4 w-full max-w-full overflow-hidden">
        {getFilteredNotifications().map(notification => (
          <div 
            key={notification.id} 
            className={`flex p-2 lg:p-4 border ${
              notification.isRead 
                ? 'border-gray-200 dark:border-gray-700' 
                : 'border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10'
            } rounded-lg transition-all`}
          >
            {/* Icon - hidden on mobile */}
            <div className="hidden lg:block mr-3 lg:mr-4 flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            
            {/* Content */}
            <div className="flex-grow min-w-0 pr-2">
              <p className={`text-xs lg:text-sm ${
                notification.isRead 
                  ? 'text-gray-600 dark:text-gray-300' 
                  : 'text-gray-900 dark:text-white font-medium'
              } leading-relaxed break-words overflow-wrap-anywhere`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatNotificationTime(notification.timestamp)}
              </p>
            </div>
            
            {/* Actions - more compact on mobile */}
            <div className="flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 flex-shrink-0">
              {!notification.isRead && (
                <button 
                  onClick={() => markAsRead(notification.id)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                  title="Mark as read"
                  aria-label="Mark as read"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
              <button 
                onClick={() => deleteNotification(notification.id)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                title="Delete notification"
                aria-label="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">
                  <span className="lg:hidden">Security</span>
                  <span className="hidden lg:inline">Security Settings</span>
                </h2>

                <form onSubmit={handlePasswordUpdate} className="space-y-4 lg:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Update Password</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Address Form Component
const AddressForm = ({ address, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: address?.type || 'shipping',
    firstName: address?.firstName || '',
    lastName: address?.lastName || '',
    address: address?.address || '',
    city: address?.city || '',
    state: address?.state || '',
    zipCode: address?.zipCode || '',
    country: address?.country || '',
    isDefault: address?.isDefault || false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 lg:p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {address ? 'Edit Address' : 'Add New Address'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="shipping">Shipping</option>
              <option value="billing">Billing</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Kenya">Kenya</option>
                
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
              Set as default address
            </label>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {address ? 'Update' : 'Add'} Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;