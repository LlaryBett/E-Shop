import api from './api';

// ✅ Fetch full dashboard stats
const getDashboardStats = () => api.get('/admin/stats');

// ✅ Fetch paginated orders
const getAllOrders = (params = {}) => api.get('/admin/orders', { params });

// ✅ ✅ Fetch paginated products from correct route (/api/products)
const getAllProducts = (params = {}) => api.get('/products', { params });

// ✅ Fetch sales analytics data
const getSalesAnalytics = (period = '30d') =>
  api.get('/admin/analytics/sales', { params: { period } });

const adminService = {
  getDashboardStats,
  getAllOrders,
  getAllProducts,
  getSalesAnalytics,
};

export default adminService;
