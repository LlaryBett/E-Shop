import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Truck, CheckCircle, XCircle, Clock, Eye, Download, Search, Filter } from 'lucide-react';
import OrderService from '../services/orderService';
import ProductService from '../services/productService';
import { useCart } from '../contexts/CartContext';
import toast from 'react-hot-toast';

const Orders = () => {
  const location = useLocation();
  const fromQuickLink = location.state?.fromQuickLink;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await OrderService.getOrders(pagination.page, pagination.limit, statusFilter !== 'all' ? statusFilter : undefined);
        setOrders(response.orders);
        setPagination(prev => ({
          ...prev,
          total: response.total
        }));
      } catch (err) {
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [pagination.page, pagination.limit, statusFilter]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleCancelOrder = async (orderId) => {
    try {
      await OrderService.cancelOrder(orderId);
      const response = await OrderService.getOrders(pagination.page, pagination.limit, statusFilter !== 'all' ? statusFilter : undefined);
      setOrders(response.orders);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to cancel order';
      toast.error(msg);
      setError(null);
    }
  };

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      const blob = await OrderService.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download invoice');
    }
  };

  const handleReorderItems = async (orderId) => {
    try {
      const items = await OrderService.reorderOrder(orderId);
      for (const item of items) {
        const product = await ProductService.getProduct(item.product);
        addToCart(product, item.quantity, item.variant);
      }
    } catch (err) {
      setError('Failed to reorder items');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-44 lg:pt-32 px-4">
        <div className="text-center">
          <Package className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500 animate-bounce mx-auto" />
          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-44 lg:pt-32 px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-8 w-8 sm:h-12 sm:w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-44 lg:pt-32 pb-4 overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Track and manage your order history
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-shrink-0 px-3 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-xs sm:text-sm"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 text-center sm:text-left">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 sm:pt-44">
            <div className="container mx-auto px-3 sm:px-4 py-4 max-w-6xl">
              <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md p-6 sm:p-8 text-center">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1">No orders found</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 px-2">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : "You haven't placed any orders yet."
                  }
                </p>
                <Link
                  to="/shop"
                  className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                >
                  Start Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-md overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          Order {order.orderNumber}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 w-fit">
                        {getStatusIcon(order.status)}
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
                      <div className="text-left sm:text-right">
                        <p className="text-base font-bold sm:text-lg text-gray-900 dark:text-white">
                          Ksh {order.pricing.total.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex space-x-1 sm:space-x-2">
                        <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
                          title="Download Invoice"
                        >
                          <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {order.items.map((item) => (
                      <div key={item._id} className="flex items-center space-x-2 sm:space-x-3">
                        <img
                          src={item.image || 'https://via.placeholder.com/150'}
                          alt={item.title}
                          className="w-10 h-10 sm:w-14 sm:h-14 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2">
                            {item.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                            Ksh {(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Ksh {item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.trackingNumber && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div>
                          <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Tracking Number</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {order.trackingNumber}
                          </p>
                        </div>
                        <button className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm">
                          Track Package
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 sm:mt-4 p-2 sm:p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h5 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-1">Shipping Address</h5>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      <p>{order.shippingAddress.name}</p>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                    {order.status === 'delivered' && (
                      <>
                        <button className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm">
                          Leave Review
                        </button>
                        <button className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm">
                          Return Items
                        </button>
                      </>
                    )}
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleCancelOrder(order._id)}
                        className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs sm:text-sm"
                      >
                        Cancel Order
                      </button>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <div className="relative flex-1">
                        <button
                          className={`reorder-btn relative w-full min-w-[100px] px-3 py-2 sm:px-4 sm:py-3 ${
                            fromQuickLink
                              ? "bg-blue-600 text-white hover:bg-blue-700 blink-attention"
                              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          } rounded-lg transition-colors text-xs sm:text-sm`}
                          onClick={() => handleReorderItems(order._id)}
                        >
                          Reorder Items
                        </button>

                        {/* Tooltip */}
                        {fromQuickLink && (
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 bg-gray-800 text-white text-xs sm:text-sm p-2 rounded-lg shadow-lg animate-bounce">
                           👇 Click here to reorder!
                            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-gray-800 rotate-45"></div>
                          </div>
                        )}
                      </div>
                      <Link
                        to="/contact"
                        className="flex-1 min-w-[100px] px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm text-center"
                      >
                        Get Help
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {pagination.total > pagination.limit && (
              <div className="flex justify-center mt-4 sm:mt-6">
                <nav className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 sm:px-4 sm:py-3 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className="px-3 py-2 sm:px-4 sm:py-3 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;