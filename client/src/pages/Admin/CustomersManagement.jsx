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
  Smile
} from 'lucide-react';
import userService from '../../services/userService'; // adjust path if needed

const CustomersManagement = () => {
  // Backend customer data
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Status and loyalty options
  const statuses = ['all', 'active', 'inactive', 'banned'];
  const loyaltyLevels = ['all', 'bronze', 'silver', 'gold', 'platinum'];

  useEffect(() => {
    setLoading(true);
    userService.getAllUsers().then(users => {
      setCustomers(users || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filter customers based on search term, status, and loyalty
  const filteredCustomers = customers.filter(customer => {
    // Defensive: support both backend and mock structure
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

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

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
    setCustomers(customers.filter(customer => customer.id !== customerToDelete));
    setShowDeleteModal(false);
    setCustomerToDelete(null);
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
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Bronze'
        };
      case 'silver':
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Silver'
        };
      case 'gold':
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Gold'
        };
      case 'platinum':
        return { 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: 'Platinum'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <Star className="h-4 w-4 mr-1" />,
          text: loyalty
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customers Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your customer accounts, loyalty programs, and customer data
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

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone, or ID..."
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
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
                <Download className="h-4 w-4" />
              </button>
            </div>
            
            {/* Filter Buttons - Desktop */}
            <div className="hidden md:flex space-x-2">
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
              
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Filters - Expanded */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:hidden">
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
            </div>
          )}
        </div>

        {/* Customers Table */}
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
                        ${customer.totalSpent?.toFixed(2) ?? customer.totalSpent ?? '0.00'}
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
                          <Link
                            to={`/admin/customers/${customer._id || customer.id}/edit`}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
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
                  {Math.min(indexOfLastItem, filteredCustomers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredCustomers.length}</span> results
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