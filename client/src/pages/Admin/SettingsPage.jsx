import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  CreditCard,
  Mail,
  Lock,
  Database,
  Zap,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Check,
  X
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationsContext';

const SettingsPage = () => {
  // Form states
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Administrator of the e-commerce platform'
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: true
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weeklyReport: true,
    orderUpdates: true,
    promotions: false
  });

  const [appearance, setAppearance] = useState({
    theme: 'light',
    density: 'normal',
    fontSize: 'medium'
  });

  const [payment, setPayment] = useState({
    stripeEnabled: true,
    paypalEnabled: false,
    defaultCurrency: 'USD'
  });

  const [email, setEmail] = useState({
    smtpHost: 'smtp.example.com',
    smtpPort: '587',
    smtpUser: 'admin@example.com',
    smtpPass: '',
    fromName: 'E-Commerce Admin',
    fromEmail: 'noreply@example.com'
  });

  const [maintenance, setMaintenance] = useState({
    maintenanceMode: false,
    backupFrequency: 'daily',
    lastBackup: '2024-02-15 03:00:00'
  });

  // UI states
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    security: false,
    notifications: false,
    appearance: false,
    payment: false,
    email: false,
    maintenance: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add context for notification events
  const { events, eventsLoading, toggleEvent } = useNotifications();

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle form changes
  const handleChange = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Settings tabs
  const tabs = [
    { id: 'profile', icon: <User className="h-4 w-4" />, label: 'Profile' },
    { id: 'security', icon: <Shield className="h-4 w-4" />, label: 'Security' },
    { id: 'notifications', icon: <Bell className="h-4 w-4" />, label: 'Notifications' },
    { id: 'appearance', icon: <Palette className="h-4 w-4" />, label: 'Appearance' },
    { id: 'payment', icon: <CreditCard className="h-4 w-4" />, label: 'Payment' },
    { id: 'email', icon: <Mail className="h-4 w-4" />, label: 'Email' },
    { id: 'maintenance', icon: <Database className="h-4 w-4" />, label: 'Maintenance' }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 bg-white dark:bg-gray-800 shadow-md lg:min-h-screen">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tabs.find(t => t.id === activeTab)?.label} Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} preferences
                </p>
              </div>
              {saveSuccess && (
                <div className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg">
                  <Check className="h-5 w-5 mr-2" />
                  <span>Settings saved successfully!</span>
                </div>
              )}
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h3>
                  <button
                    type="button"
                    onClick={() => toggleSection('profile')}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {expandedSections.profile ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {expandedSections.profile && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <img
                          className="h-16 w-16 rounded-full object-cover"
                          src={profile.avatar}
                          alt="User avatar"
                        />
                      </div>
                      <div className="flex-1">
                        <button
                          type="button"
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Change avatar
                        </button>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          JPG, GIF or PNG. Max size of 2MB
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Full name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={profile.name}
                            onChange={handleChange(setProfile)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email address
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={profile.email}
                            onChange={handleChange(setProfile)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Bio
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="bio"
                            name="bio"
                            rows={3}
                            value={profile.bio}
                            onChange={handleChange(setProfile)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Brief description for your profile.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Settings</h3>
                  <button
                    type="button"
                    onClick={() => toggleSection('security')}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {expandedSections.security ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {expandedSections.security && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Change Password</h4>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Current password
                          </label>
                          <div className="mt-1 relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="currentPassword"
                              id="currentPassword"
                              value={security.currentPassword}
                              onChange={handleChange(setSecurity)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm pr-10"
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-4">
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            New password
                          </label>
                          <div className="mt-1 relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="newPassword"
                              id="newPassword"
                              value={security.newPassword}
                              onChange={handleChange(setSecurity)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm pr-10"
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="sm:col-span-4">
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm new password
                          </label>
                          <div className="mt-1 relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="confirmPassword"
                              id="confirmPassword"
                              value={security.confirmPassword}
                              onChange={handleChange(setSecurity)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm pr-10"
                            />
                            <button
                              type="button"
                              onClick={togglePasswordVisibility}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {security.twoFactorEnabled
                              ? 'Two-factor authentication adds an extra layer of security to your account'
                              : 'Enable two-factor authentication for added security'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSecurity(prev => ({
                            ...prev,
                            twoFactorEnabled: !prev.twoFactorEnabled
                          }))}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            security.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              security.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Active Sessions</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Chrome on Windows</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last active: 2 hours ago</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">IP: 192.168.1.1</p>
                          </div>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Revoke
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Safari on iPhone</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last active: 1 day ago</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">IP: 192.168.1.2</p>
                          </div>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Preferences</h3>
      <button
        type="button"
        onClick={() => toggleSection('notifications')}
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        {expandedSections.notifications ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
    </div>

    {expandedSections.notifications && (
      <div className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Email Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive notifications via email
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  email: !prev.email
                }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  notifications.email ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.email ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Weekly reports</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get weekly summary of your store performance
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  weeklyReport: !prev.weeklyReport
                }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  notifications.weeklyReport ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.weeklyReport ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Order updates</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Notify me about order status changes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  orderUpdates: !prev.orderUpdates
                }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  notifications.orderUpdates ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.orderUpdates ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Push Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Push notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive push notifications on your device
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  push: !prev.push
                }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  notifications.push ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.push ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Promotional offers</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified about special offers and discounts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  promotions: !prev.promotions
                }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  notifications.promotions ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifications.promotions ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* New Event Management Section */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Notification Events</h4>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {eventsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading events...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No notification events found.
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event.eventKey}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {event.defaultTitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {event.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.enabled 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {event.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => toggleEvent(event.eventKey, !event.enabled)}
                              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                event.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  event.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add New Event
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
                  <button
                    type="button"
                    onClick={() => toggleSection('appearance')}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {expandedSections.appearance ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {expandedSections.appearance && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Theme</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, theme: 'light' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.theme === 'light' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full h-20 bg-white rounded mb-2 border border-gray-200"></div>
                          <span className="text-sm">Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, theme: 'dark' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.theme === 'dark' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full h-20 bg-gray-800 rounded mb-2 border border-gray-700"></div>
                          <span className="text-sm">Dark</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, theme: 'system' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.theme === 'system' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full h-20 rounded mb-2 overflow-hidden">
                            <div className="h-1/2 bg-white border-b border-gray-200"></div>
                            <div className="h-1/2 bg-gray-800"></div>
                          </div>
                          <span className="text-sm">System</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Density</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, density: 'compact' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.density === 'compact' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full space-y-1 mb-2">
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          </div>
                          <span className="text-sm">Compact</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, density: 'normal' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.density === 'normal' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full space-y-2 mb-2">
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          </div>
                          <span className="text-sm">Normal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, density: 'spacious' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.density === 'spacious' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full space-y-3 mb-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                          </div>
                          <span className="text-sm">Spacious</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Font Size</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, fontSize: 'small' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.fontSize === 'small' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full mb-2">
                            <p className="text-xs text-center">Sample text</p>
                          </div>
                          <span className="text-sm">Small</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, fontSize: 'medium' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.fontSize === 'medium' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full mb-2">
                            <p className="text-sm text-center">Sample text</p>
                          </div>
                          <span className="text-sm">Medium</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppearance(prev => ({ ...prev, fontSize: 'large' }))}
                          className={`p-4 border rounded-lg flex flex-col items-center ${
                            appearance.fontSize === 'large' 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="w-full mb-2">
                            <p className="text-base text-center">Sample text</p>
                          </div>
                          <span className="text-sm">Large</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Methods</h3>
                  <button
                    type="button"
                    onClick={() => toggleSection('payment')}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {expandedSections.payment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {expandedSections.payment && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Payment Gateways</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">Stripe</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Credit card payments</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPayment(prev => ({
                              ...prev,
                              stripeEnabled: !prev.stripeEnabled
                            }))}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              payment.stripeEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                payment.stripeEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-6 bg-yellow-400 rounded flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">PayPal</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Alternative payment method</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPayment(prev => ({
                              ...prev,
                              paypalEnabled: !prev.paypalEnabled
                            }))}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              payment.paypalEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                payment.paypalEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Currency Settings</h4>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Default Currency
                          </label>
                          <select
                            id="defaultCurrency"
                            name="defaultCurrency"
                            value={payment.defaultCurrency}
                            onChange={handleChange(setPayment)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          >
                            <option value="USD">US Dollar (USD)</option>
                            <option value="EUR">Euro (EUR)</option>
                            <option value="GBP">British Pound (GBP)</option>
                            <option value="JPY">Japanese Yen (JPY)</option>
                            <option value="CAD">Canadian Dollar (CAD)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Payment Test Mode</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Enable test mode for payment processing
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Use test cards to simulate transactions without charging real money
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-200 dark:bg-gray-600`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Configuration</h3>
                  <button
                    type="button"
                    onClick={() => toggleSection('email')}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {expandedSections.email ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {expandedSections.email && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          name="smtpHost"
                          id="smtpHost"
                          value={email.smtpHost}
                          onChange={handleChange(setEmail)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          SMTP Port
                        </label>
                        <input
                          type="text"
                          name="smtpPort"
                          id="smtpPort"
                          value={email.smtpPort}
                          onChange={handleChange(setEmail)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          SMTP Username
                        </label>
                        <input
                          type="text"
                          name="smtpUser"
                          id="smtpUser"
                          value={email.smtpUser}
                          onChange={handleChange(setEmail)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="smtpPass" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          SMTP Password
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="smtpPass"
                            id="smtpPass"
                            value={email.smtpPass}
                            onChange={handleChange(setEmail)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          From Name
                        </label>
                        <input
                          type="text"
                          name="fromName"
                          id="fromName"
                          value={email.fromName}
                          onChange={handleChange(setEmail)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          From Email
                        </label>
                        <input
                          type="email"
                          name="fromEmail"
                          id="fromEmail"
                          value={email.fromEmail}
                          onChange={handleChange(setEmail)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Test Email Configuration</h4>
                      <div className="flex items-center space-x-4">
                        <input
                          type="email"
                          placeholder="Enter test email address"
                          className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Send Test
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Settings */}
            {activeTab === 'maintenance' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Maintenance</h3>
                  <button
                    type="button"
                    onClick={() => toggleSection('maintenance')}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {expandedSections.maintenance ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {expandedSections.maintenance && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">Maintenance Mode</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {maintenance.maintenanceMode
                            ? 'Your store is currently in maintenance mode and not accessible to customers'
                            : 'Enable maintenance mode to temporarily take your store offline'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMaintenance(prev => ({
                          ...prev,
                          maintenanceMode: !prev.maintenanceMode
                        }))}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          maintenance.maintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            maintenance.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {maintenance.maintenanceMode && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Zap className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              Maintenance mode is active. Customers will see a maintenance page when visiting your store.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Backup Settings</h4>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="backupFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Backup Frequency
                          </label>
                          <select
                            id="backupFrequency"
                            name="backupFrequency"
                            value={maintenance.backupFrequency}
                            onChange={handleChange(setMaintenance)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Last Backup
                          </label>
                          <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {maintenance.lastBackup}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Database Operations</h4>
                      <div className="space-y-4">
                        <button
                          type="button"
                          className="w-full flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Optimize Database</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Improve database performance by optimizing tables
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>

                        <button
                          type="button"
                          className="w-full flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Run Database Backup</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Create a manual backup of your database
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </button>

                        <button
                          type="button"
                          className="w-full flex justify-between items-center p-4 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Reset All Data</p>
                            <p className="text-sm text-red-500 dark:text-red-400">
                              Warning: This will delete all data and cannot be undone
                            </p>
                          </div>
                          <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Form Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;