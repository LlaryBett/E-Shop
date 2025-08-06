import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Filter, 
  Check, 
  CheckCheck, 
  Trash2, 
  X, 
  Clock, 
  Package, 
  Tag, 
  Heart, 
  Settings,
  ChevronDown,
  Search,
  MoreVertical
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';

const NotificationsPage = () => {
  const {
    filter,
    setFilter,
    sortBy,
    setSortBy,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getUnreadCount,
    getFilteredNotifications
  } = useNotifications();

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const notifications = getFilteredNotifications();
  const unreadCount = getUnreadCount();

  // Defensive: If notifications is not an array, fallback to empty array
  const filteredNotifications = Array.isArray(notifications)
    ? notifications.filter(notification =>
        (notification.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (notification.message || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filterOptions = [
    { value: 'all', label: 'All Notifications', icon: Bell },
    { value: 'unread', label: 'Unread', icon: Check },
    { value: 'order', label: 'Orders', icon: Package },
    { value: 'promotion', label: 'Promotions', icon: Tag },
    { value: 'wishlist', label: 'Wishlist', icon: Heart },
    { value: 'system', label: 'System', icon: Settings }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'unread', label: 'Unread First' }
  ];

  const getNotificationColor = (type, isRead) => {
    const colors = {
      order: isRead ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700',
      promotion: isRead ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700',
      wishlist: isRead ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700',
      system: isRead ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700'
    };
    return colors[type] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const toggleNotificationSelection = (id) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = (action) => {
    if (action === 'markRead') {
      selectedNotifications.forEach(id => markAsRead(id));
    } else if (action === 'delete') {
      selectedNotifications.forEach(id => deleteNotification(id));
    }
    setSelectedNotifications([]);
  };

  React.useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 sm:pt-24 pb-4 sm:pb-8 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {/* Title and Actions - Stack on mobile */}
          <div className="mb-4 sm:mb-6">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Notifications
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            
            {/* Action Buttons - Stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300 text-sm sm:text-base w-full sm:w-auto"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300 text-sm sm:text-base w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Search - Full width on mobile */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm sm:text-base"
              />
            </div>

            {/* Filter Button - Full width on mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 w-full sm:w-auto text-sm sm:text-base"
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Filter & Sort</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Options - Mobile responsive */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 animate-in slide-in-from-top-2">
              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6">
                {/* Filter by Type */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Filter by Type</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                    {filterOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFilter(option.value)}
                          className={`flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg transition-colors duration-300 text-xs sm:text-sm ${
                            filter === option.value
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm sm:text-base">Sort By</h3>
                  <div className="space-y-2">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`w-full flex items-center px-2 sm:px-3 py-2 rounded-lg transition-colors duration-300 text-xs sm:text-sm ${
                          sortBy === option.value
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions - Mobile responsive */}
          {selectedNotifications.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <span className="text-blue-700 dark:text-blue-300 font-medium text-sm sm:text-base">
                  {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleBulkAction('markRead')}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 text-sm"
                  >
                    <Check className="h-4 w-4" />
                    <span>Mark Read</span>
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <Bell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No notifications found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base px-4">
                {searchQuery ? 'Try adjusting your search terms' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`relative border rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all duration-300 hover:shadow-lg ${
                  getNotificationColor(notification.type, notification.isRead)
                } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleNotificationSelection(notification.id)}
                    className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 flex-shrink-0"
                  />

                  {/* Notification Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-2xl border border-gray-200 dark:border-gray-700">
                      {notification.icon}
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base line-clamp-2">
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                          {notification.message}
                        </p>
                      </div>
                      
                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 sm:mt-4">
                      <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{getTimeAgo(notification.timestamp)}</span>
                      </div>

                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {/* Action Button */}
                        {notification.actionText && notification.actionLink && (
                          <Link
                            to={
                              notification.actionLink.startsWith('/orders/')
                                ? '/orders'
                                : notification.actionLink
                            }
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-xs sm:text-sm hover:underline px-2 py-1 rounded"
                          >
                            {notification.actionText}
                          </Link>
                        )}

                        {/* Mark as Read */}
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 sm:p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300"
                          title="Delete notification"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredNotifications.length >= 10 && (
          <div className="text-center mt-6 sm:mt-8">
            <button className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 text-sm sm:text-base">
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;