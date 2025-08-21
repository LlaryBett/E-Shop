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
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  CreditCard,
  User
} from 'lucide-react';
import orderService from '../../services/orderService'; // adjust path if needed
import * as XLSX from 'xlsx'; // Add this import

const OrdersManagement = () => {
  // Sample order data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    paymentStatus: '',
    trackingNumber: '',
    notes: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Status and payment options
  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
  const payments = ['all', 'paid', 'pending', 'refunded', 'failed'];

  useEffect(() => {
    setLoading(true);
    orderService.getAllOrders(1, 100).then(res => {
      // res.orders is expected from your service
      setOrders(res.orders || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filter orders based on search term, status, and payment
  const filteredOrders = orders.filter(order => {
    // Defensive: use order.orderNumber, order.user?.name, order.user?.email
    const orderId = order.orderNumber || order._id || '';
    const customer = order.user?.name || '';
    const email = order.user?.email || '';
    const matchesSearch =
      orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    // Payment info is nested: order.paymentInfo.status
    const paymentStatus = order.paymentInfo?.status || '';
    const matchesPayment = selectedPayment === 'all' || paymentStatus === selectedPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // Defensive: support sorting by createdAt, orderNumber, etc.
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    // For date, use createdAt
    if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
      aValue = a.createdAt;
      bValue = b.createdAt;
    }
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);

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

  // Delete order
  const handleDelete = (id) => {
    setOrderToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setOrders(orders.filter(order => order._id !== orderToDelete));
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  // Edit order
  const handleEdit = (order) => {
    setOrderToEdit(order);
    setEditFormData({
      status: order.status || '',
      paymentStatus: order.paymentInfo?.status || '',
      trackingNumber: order.trackingNumber || '',
      notes: order.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Replace the existing handleUpdateOrder and confirmDelete functions with these:

const handleUpdateOrder = async () => {
  if (!orderToEdit) return;
  
  setIsUpdating(true);
  try {
    // Call the backend API to update the order
    const updatedOrder = await orderService.updateOrder(orderToEdit._id, {
      status: editFormData.status,
      paymentStatus: editFormData.paymentStatus,
      trackingNumber: editFormData.trackingNumber,
      notes: editFormData.notes
    });

    // Update the local state with the response from backend
    setOrders(orders.map(order => 
      order._id === orderToEdit._id ? updatedOrder : order
    ));

    setShowEditModal(false);
    setOrderToEdit(null);
    
    // You can add a success toast notification here
    console.log('Order updated successfully');
  } catch (error) {
    console.error('Error updating order:', error);
    // Handle error - show error toast notification
    alert('Failed to update order. Please try again.');
  } finally {
    setIsUpdating(false);
  }
};



  // Export orders to Excel (with N/A for missing and wide columns)
  const handleExportOrders = () => {
    const columns = [
      'Order ID',
      'Customer',
      'Email',
      'Date',
      'Total',
      'Status',
      'Payment'
    ];

    const exportData = filteredOrders.map(order => ({
      'Order ID': order.orderNumber || order._id || 'N/A',
      'Customer': order.user?.name || 'N/A',
      'Email': order.user?.email || 'N/A',
      'Date': order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
      'Total': order.pricing?.total != null ? order.pricing.total.toFixed(2) : 'N/A',
      'Status': order.status || 'N/A',
      'Payment': order.paymentInfo?.status
        ? order.paymentInfo.status.charAt(0).toUpperCase() + order.paymentInfo.status.slice(1)
        : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: columns });
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: "A1" });

    worksheet['!cols'] = [
      { wch: 24 }, // Order ID
      { wch: 22 }, // Customer
      { wch: 32 }, // Email
      { wch: 22 }, // Date
      { wch: 14 }, // Total
      { wch: 14 }, // Status
      { wch: 14 }  // Payment
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    XLSX.writeFile(workbook, 'orders.xlsx');
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          text: 'Completed'
        };
      case 'processing':
        return { 
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: 'Processing'
        };
      case 'shipped':
        return { 
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
          icon: <Truck className="h-4 w-4 mr-1" />,
          text: 'Shipped'
        };
      case 'delivered':
        return { 
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          text: 'Delivered'
        };
      case 'pending':
        return { 
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: 'Pending'
        };
      case 'cancelled':
        return { 
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
          icon: <XCircle className="h-4 w-4 mr-1" />,
          text: 'Cancelled'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: status
        };
    }
  };

  // Get payment color
  const getPaymentColor = (payment) => {
    switch (payment) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Orders Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage customer orders, fulfillment, and tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/admin/orders/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Order</span>
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
                placeholder="Search orders by ID, customer, or email..."
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
                onClick={handleExportOrders}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
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
                  value={selectedPayment}
                  onChange={(e) => {
                    setSelectedPayment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Payments</option>
                  {payments.filter(payment => payment !== 'all').map(payment => (
                    <option key={payment} value={payment}>
                      {payment.charAt(0).toUpperCase() + payment.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                onClick={handleExportOrders}
              >
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment</label>
                <select
                  value={selectedPayment}
                  onChange={(e) => {
                    setSelectedPayment(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Payments</option>
                  {payments.filter(payment => payment !== 'all').map(payment => (
                    <option key={payment} value={payment}>
                      {payment.charAt(0).toUpperCase() + payment.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
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
                      onClick={() => requestSort('id')}
                      className="flex items-center space-x-1"
                    >
                      <span>Order ID</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('customer')}
                      className="flex items-center space-x-1"
                    >
                      <span>Customer</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('date')}
                      className="flex items-center space-x-1"
                    >
                      <span>Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('total')}
                      className="flex items-center space-x-1"
                    >
                      <span>Total</span>
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
                      onClick={() => requestSort('payment')}
                      className="flex items-center space-x-1"
                    >
                      <span>Payment</span>
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
                  currentItems.map(order => (
                    <tr key={order._id || order.orderNumber} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {order.orderNumber || order._id}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.user?.name || ''}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {order.user?.email || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        Ksh {order.pricing?.total?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(order.status).color}`}>
                            {getStatusInfo(order.status).icon}
                            {getStatusInfo(order.status).text}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentColor(order.paymentInfo?.status)}`}>
                          {order.paymentInfo?.status ? order.paymentInfo.status.charAt(0).toUpperCase() + order.paymentInfo.status.slice(1) : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/orders/${order._id || order.orderNumber}`}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEdit(order)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(order._id || order.orderNumber)}
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
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <ShoppingCart className="h-12 w-12 text-gray-400 mb-2" />
                        <p>No orders found matching your criteria</p>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedStatus('all');
                            setSelectedPayment('all');
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
                  {Math.min(indexOfLastItem, filteredOrders.length)}
                </span>{' '}
                of <span className="font-medium">{filteredOrders.length}</span> results
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

      {/* Edit Order Modal */}
      {showEditModal && orderToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Order #{orderToEdit.orderNumber || orderToEdit._id}
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Order Info */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Customer:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {orderToEdit.user?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {orderToEdit.user?.email || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      Ksh {orderToEdit.pricing?.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {orderToEdit.createdAt ? new Date(orderToEdit.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Order Status
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

                  {/* Payment Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Status
                    </label>
                    <select
                      value={editFormData.paymentStatus}
                      onChange={(e) => handleEditFormChange('paymentStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {payments.filter(payment => payment !== 'all').map(payment => (
                        <option key={payment} value={payment}>
                          {payment.charAt(0).toUpperCase() + payment.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.trackingNumber}
                    onChange={(e) => handleEditFormChange('trackingNumber', e.target.value)}
                    placeholder="Enter tracking number..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => handleEditFormChange('notes', e.target.value)}
                    placeholder="Add internal notes about this order..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Order Items Preview */}
                {orderToEdit.items && orderToEdit.items.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Order Items ({orderToEdit.items.length})
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                      {orderToEdit.items.map((item, index) => (
                        <div key={index} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.product?.title || item.name || 'Unknown Product'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity} × Ksh {item.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Ksh {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                onClick={handleUpdateOrder}
                disabled={isUpdating}
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
                    <span>Update Order</span>
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
                Are you sure you want to delete this order? This action cannot be undone.
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

export default OrdersManagement;