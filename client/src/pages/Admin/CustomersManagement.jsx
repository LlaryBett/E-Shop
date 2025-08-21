import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Check,
  Sliders,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  ArrowUpDown,
  Shield,
  Star,
  Frown,
  Smile,
  MessageSquare,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import userService from '../../services/userService';
import * as XLSX from 'xlsx';

const CustomersManagement = () => {
  // Backend customer data
  const [customers, setCustomers] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLoyalty, setSelectedLoyalty] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'joinDate', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: '',
    loyalty: '',
    notes: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Contact messages state
  const [activeTab, setActiveTab] = useState('customers');
  const [messageFilter, setMessageFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Status and loyalty options
  const statuses = ['all', 'active', 'inactive', 'banned'];
  const loyaltyLevels = ['all', 'bronze', 'silver', 'gold', 'platinum'];
  const messageStatuses = ['all', 'new', 'pending', 'replied', 'archived'];

  const { getAllContactMessages, updateContactMessageStatus } = useAuth();

  useEffect(() => {
    setLoading(true);
    userService.getAllUsers().then(users => {
      setCustomers(users || []);
      setLoading(false);
    }).catch(() => setLoading(false));

    setLoadingMessages(true);
    // Use AuthContext to fetch contact messages
    getAllContactMessages().then(messages => {
      // If response shape is { success, count, data }, use .data
      setContactMessages(Array.isArray(messages) ? messages : messages.data || []);
      setLoadingMessages(false);
    }).catch(() => setLoadingMessages(false));
  }, []);

  // Filter customers based on search term, status, and loyalty
  const filteredCustomers = customers.filter(customer => {
    const id = customer._id || customer.id || '';
    const name = customer.name || '';
    const email = customer.email || '';
    const phone = customer.phone || '';
    const status = customer.status || 'active';
    const loyalty = customer.loyalty || '';
    const matchesSearch =
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
    const matchesLoyalty = selectedLoyalty === 'all' || loyalty === selectedLoyalty;
    return matchesSearch && matchesStatus && matchesLoyalty;
  });

  // Filter contact messages
  const filteredMessages = contactMessages.filter(message => {
    if (messageFilter === 'all') return true;
    return message.status === messageFilter;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Sort messages by date (newest first)
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activeTab === 'customers' 
    ? sortedCustomers.slice(indexOfFirstItem, indexOfLastItem)
    : sortedMessages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(
    (activeTab === 'customers' ? sortedCustomers.length : sortedMessages.length) / itemsPerPage
  );

  // Request sort
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Delete customer
  const handleDelete = (id) => {
    setCustomerToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setCustomers(customers.filter(customer => customer._id !== customerToDelete));
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  // Edit customer
  const handleEdit = (customer) => {
    setCustomerToEdit(customer);
    setEditFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      status: customer.status || 'active',
      loyalty: customer.loyalty || '',
      notes: customer.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update customer
const handleUpdateCustomer = async () => {
  if (!customerToEdit) return;
  
  setIsUpdating(true);
  try {
    // Call API to update the customer using userService
    const updatedCustomer = await userService.updateCustomer(
      customerToEdit._id || customerToEdit.id,
      {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        status: editFormData.status,
        loyalty: editFormData.loyalty,
        notes: editFormData.notes
      }
    );

    // Update the customers list with the response from the API
    setCustomers(customers.map(customer => 
      customer._id === customerToEdit._id ? updatedCustomer : customer
    ));

    setShowEditModal(false);
    setCustomerToEdit(null);
    // You can add a toast notification here
  } catch (error) {
    console.error('Error updating customer:', error);
    // Handle error - show toast notification
  } finally {
    setIsUpdating(false);
  }
};



  // Message actions
  const handleReply = async () => {
    if (!selectedMessage || !replyContent) return;
    setIsReplying(true);
    try {
      // Update status to 'replied' and send reply content
      const updatedRes = await updateContactMessageStatus(selectedMessage._id, 'replied', replyContent);
      // If response shape is { success, message, data }, use .data
      const updatedMessage = updatedRes.data || updatedRes;
      setContactMessages(contactMessages.map(msg =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
      setSelectedMessage(updatedMessage);
      setReplyContent('');
      // Optionally, show notification to admin
      // toast.success('Reply sent and customer notified');
    } finally {
      setIsReplying(false);
    }
  };

  const updateMessageStatus = async (id, status) => {
    try {
      const updatedMessage = await updateContactMessageStatus(id, status);
      setContactMessages(contactMessages.map(msg =>
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage(updatedMessage);
      }
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  };

  // Export customers to Excel (with N/A for missing and wide columns)
  const handleExportCustomers = () => {
    const columns = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Loyalty',
      'Orders',
      'TotalSpent',
      'Joined'
    ];

    // Fill missing fields with 'N/A'
    const exportData = filteredCustomers.map(c => ({
      ID: c._id || c.id || 'N/A',
      Name: c.name || 'N/A',
      Email: c.email || 'N/A',
      Phone: c.phone || 'N/A',
      Status: c.status || 'N/A',
      Loyalty: c.loyalty || 'N/A',
      Orders: c.orders ?? c.orderCount ?? 'N/A',
      TotalSpent: c.totalSpent != null ? c.totalSpent : 'N/A',
      Joined: c.joinDate || c.createdAt
        ? new Date(c.joinDate || c.createdAt).toLocaleString()
        : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: columns });
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: "A1" });

    // Set column widths for better visibility
    worksheet['!cols'] = [
      { wch: 28 }, // ID
      { wch: 22 }, // Name
      { wch: 32 }, // Email
      { wch: 18 }, // Phone
      { wch: 14 }, // Status
      { wch: 14 }, // Loyalty
      { wch: 10 }, // Orders
      { wch: 14 }, // TotalSpent
      { wch: 28 }  // Joined
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, 'customers.xlsx');
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: <Smile className="h-4 w-4 mr-1" />,
          text: 'Active'
        };
      case 'inactive':
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: <Frown className="h-4 w-4 mr-1" />,
          text: 'Inactive'
        };
      case 'banned':
        return { 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: <Shield className="h-4 w-4 mr-1" />,
          text: 'Banned'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <User className="h-4 w-4 mr-1" />,
          text: status
        };
    }
  };

  // Get loyalty color and icon
  const getLoyaltyInfo = (loyalty) => {
    switch (loyalty) {
      case 'bronze':
        return { 
          color: 'bg-yellow-800 text-yellow-100 dark:bg-yellow-900/80 dark:text-yellow-200 border border-yellow-900',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Bronze'
        };
      case 'silver':
        return { 
          color: 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-100 border border-gray-400',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Silver'
        };
      case 'gold':
        return { 
          color: 'bg-yellow-300 text-yellow-900 dark:bg-yellow-400 dark:text-yellow-900 border border-yellow-500',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Gold'
        };
      case 'platinum':
        return { 
          color: 'bg-blue-200 text-blue-900 dark:bg-blue-300 dark:text-blue-900 border border-blue-400',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Platinum'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: loyalty || 'None'
        };
    }
  };

  // Get message status info
  const getMessageStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          text: 'Pending'
        };
      case 'replied':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: <Check className="h-4 w-4 mr-1" />,
          text: 'Replied'
        };
      case 'archived':
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <HelpCircle className="h-4 w-4 mr-1" />,
          text: 'Archived'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <MessageSquare className="h-4 w-4 mr-1" />,
          text: status
        };
    }
  };

  // Count of unattended messages (status: 'new' or 'pending')
  const unattendedCount = contactMessages.filter(
    msg => msg.status === 'new' || msg.status === 'pending'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customers Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your customer accounts, loyalty programs, and customer support
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/admin/customers/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4">
          <button
            onClick={() => {
              setActiveTab('customers');
              setCurrentPage(1);
            }}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'customers' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => {
              setActiveTab('messages');
              setCurrentPage(1);
            }}
            className={`py-2 px-4 border-b-2 font-medium text-sm relative ${activeTab === 'messages' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Contact Messages
            {unattendedCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {unattendedCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'customers' 
                    ? "Search customers by name, email, phone, or ID..." 
                    : "Search messages by name, email, or subject..."
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            {/* Filter Buttons - Mobile */}
            <div className="flex md:hidden space-x-2 w-full">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button 
                onClick={activeTab === 'customers' ? handleExportCustomers : undefined}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            {/* Filter Buttons - Desktop */}
            <div className="hidden md:flex space-x-2">
              {activeTab === 'customers' ? (
                <>
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Statuses</option>
                      {statuses.filter(status => status !== 'all').map(status => (
                        <option key={status} value={status}>
                          {getStatusInfo(status).text}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <Sliders className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedLoyalty}
                      onChange={(e) => {
                        setSelectedLoyalty(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Loyalty Levels</option>
                      {loyaltyLevels.filter(level => level !== 'all').map(level => (
                        <option key={level} value={level}>
                          {getLoyaltyInfo(level).text}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <Star className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <select
                    value={messageFilter}
                    onChange={(e) => {
                      setMessageFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {messageStatuses.map(status => (
                      <option key={status} value={status}>
                        {getMessageStatusInfo(status).text}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <Filter className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              )}
              
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                onClick={activeTab === 'customers' ? handleExportCustomers : undefined}
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Filters - Expanded */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
              {activeTab === 'customers' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Statuses</option>
                      {statuses.filter(status => status !== 'all').map(status => (
                        <option key={status} value={status}>
                          {getStatusInfo(status).text}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loyalty</label>
                    <select
                      value={selectedLoyalty}
                      onChange={(e) => {
                        setSelectedLoyalty(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Levels</option>
                      {loyaltyLevels.filter(level => level !== 'all').map(level => (
                        <option key={level} value={level}>
                          {getLoyaltyInfo(level).text}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Status</label>
                  <select
                    value={messageFilter}
                    onChange={(e) => {
                      setMessageFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {messageStatuses.map(status => (
                      <option key={status} value={status}>
                        {getMessageStatusInfo(status).text}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row">
          {/* Table Area */}
          <div className={`${selectedMessage ? 'md:w-2/3' : 'w-full'}`}>
            {/* Customers Table */}
            {activeTab === 'customers' ? (
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <button 
                            onClick={() => requestSort('name')}
                            className="flex items-center space-x-1"
                          >
                            <span>Customer</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <button 
                            onClick={() => requestSort('email')}
                            className="flex items-center space-x-1"
                          >
                            <span>Contact</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <button 
                            onClick={() => requestSort('joinDate')}
                            className="flex items-center space-x-1"
                          >
                            <span>Member Since</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <button 
                            onClick={() => requestSort('orders')}
                            className="flex items-center space-x-1"
                          >
                            <span>Orders</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <button 
                            onClick={() => requestSort('totalSpent')}
                            className="flex items-center space-x-1"
                          >
                            <span>Total Spent</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <button 
                            onClick={() => requestSort('status')}
                            className="flex items-center space-x-1"
                          >
                            <span>Status</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <button 
                            onClick={() => requestSort('loyalty')}
                            className="flex items-center space-x-1"
                          >
                            <span>Loyalty</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentItems.length > 0 ? (
                        currentItems.map(customer => (
                          <tr key={customer._id || customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {customer.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {customer._id || customer.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                                  {customer.email}
                                </div>
                                <div className="flex items-center mt-1">
                                  <Phone className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                                  {customer.phone}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                                {customer.joinDate
                                  ? new Date(customer.joinDate).toLocaleDateString()
                                  : (customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '')}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <ShoppingCart className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                                {customer.orders ?? customer.orderCount ?? 0}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              Ksh {customer.totalSpent?.toFixed(2) ?? customer.totalSpent ?? '0.00'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(customer.status || 'active').color}`}>
                                  {getStatusInfo(customer.status || 'active').icon}
                                  {getStatusInfo(customer.status || 'active').text}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLoyaltyInfo(customer.loyalty || '').color}`}>
                                  {getLoyaltyInfo(customer.loyalty || '').icon}
                                  {getLoyaltyInfo(customer.loyalty || '').text}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Link
                                  to={`/admin/customers/${customer._id || customer.id}`}
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => handleEdit(customer)}
                                  className="text-green-600 hover:text-green-700 p-1"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(customer._id || customer.id)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col items-center justify-center">
                              <User className="h-12 w-12 text-gray-400 mb-2" />
                              <p>No customers found matching your criteria</p>
                              <button 
                                onClick={() => {
                                  setSearchTerm('');
                                  setSelectedStatus('all');
                                  setSelectedLoyalty('all');
                                  setCurrentPage(1);
                                }}
                                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Clear filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              /* Messages Table */
              <div className="overflow-x-auto">
                {loadingMessages ? (
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {currentItems.length > 0 ? (
                        currentItems.map(message => (
                          <tr 
                            key={message._id} 
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedMessage?._id === message._id ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
                            onClick={() => setSelectedMessage(message)}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {message.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {message.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">
                                {message.subject}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {message.message.substring(0, 50)}...
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {message.category}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMessageStatusInfo(message.status).color}`}>
                                  {getMessageStatusInfo(message.status).icon}
                                  {getMessageStatusInfo(message.status).text}
                                </span>
                                <select
                                  value={message.status}
                                  onClick={e => e.stopPropagation()}
                                  onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    await updateMessageStatus(message._id, newStatus);
                                  }}
                                  className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800"
                                >
                                  {messageStatuses.filter(s => s !== 'all').map(status => (
                                    <option key={status} value={status}>
                                      {getMessageStatusInfo(status).text}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMessage(message);
                                  }}
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateMessageStatus(message._id, 'archived');
                                  }}
                                  className="text-gray-600 hover:text-gray-700 p-1"
                                  title="Archive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col items-center justify-center">
                              <MessageSquare className="h-12 w-12 text-gray-400 mb-2" />
                              <p>No messages found matching your criteria</p>
                              <button 
                                onClick={() => {
                                  setSearchTerm('');
                                  setMessageFilter('all');
                                  setCurrentPage(1);
                                }}
                                className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Clear filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Message Detail Sidebar */}
          {activeTab === 'messages' && selectedMessage && (
            <div className="md:w-1/3 border-l border-gray-200 dark:border-gray-700">
              <div className="p-4 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">Message Details</h3>
                <button 
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">From</h4>
                  <p className="text-gray-900 dark:text-white">{selectedMessage.name} ({selectedMessage.email})</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</h4>
                  <p className="text-gray-900 dark:text-white">{selectedMessage.subject}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</h4>
                  <p className="text-gray-900 dark:text-white capitalize">{selectedMessage.category}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Received</h4>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Message</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-900 dark:text-white whitespace-pre-line">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>
                
                {selectedMessage.reply && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Your Reply</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-gray-900 dark:text-white whitespace-pre-line">
                        {selectedMessage.reply}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Replied on {new Date(selectedMessage.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                
                {(!selectedMessage.reply || selectedMessage.status !== 'replied') && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {selectedMessage.reply ? 'Update Reply' : 'Reply to Customer'}
                    </h4>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Type your response here..."
                    />
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => updateMessageStatus(selectedMessage._id, 'archived')}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Archive
                      </button>
                      <button
                        onClick={handleReply}
                        disabled={isReplying || !replyContent}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {isReplying ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {currentItems.length > 0 && (
          <div className="px-4 py-3 flex flex-col md:flex-row items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex items-center justify-between md:justify-start mb-4 md:mb-0">
              <div className="mr-4">
                <label htmlFor="itemsPerPage" className="sr-only">Items per page</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, activeTab === 'customers' ? filteredCustomers.length : filteredMessages.length)}
                </span>{' '}
                of <span className="font-medium">
                  {activeTab === 'customers' ? filteredCustomers.length : filteredMessages.length}
                </span> results
              </p>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 border rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Customer Modal */}
      {showEditModal && customerToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Customer
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Customer Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Customer ID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {customerToEdit._id || customerToEdit.id}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Member Since:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {customerToEdit.joinDate 
                        ? new Date(customerToEdit.joinDate).toLocaleDateString()
                        : (customerToEdit.createdAt ? new Date(customerToEdit.createdAt).toLocaleDateString() : 'N/A')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Orders:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {customerToEdit.orders ?? customerToEdit.orderCount ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Spent:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      Ksh {customerToEdit.totalSpent?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter customer name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => handleEditFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => handleEditFormChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {statuses.filter(status => status !== 'all').map(status => (
                        <option key={status} value={status}>
                          {getStatusInfo(status).text}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Loyalty Level */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Loyalty Level
                    </label>
                    <select
                      value={editFormData.loyalty}
                      onChange={(e) => handleEditFormChange('loyalty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">No Loyalty Level</option>
                      {loyaltyLevels.filter(level => level !== 'all').map(level => (
                        <option key={level} value={level}>
                          {getLoyaltyInfo(level).text}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => handleEditFormChange('notes', e.target.value)}
                    placeholder="Add internal notes about this customer..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCustomer}
                disabled={isUpdating || !editFormData.name || !editFormData.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Update Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete this customer? All their data will be permanently removed.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersManagement;