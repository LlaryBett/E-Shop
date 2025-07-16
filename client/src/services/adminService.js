import api from './api';

// ✅ Fetch full dashboard stats (includes totals, growth, recent orders, top products, monthly revenue)
const getDashboardStats = () => api.get('/admin/stats');

// ✅ Fetch paginated orders (with optional filters: status, dateFrom, dateTo, search, page, limit)
const getAllOrders = (params = {}) => api.get('/admin/orders', { params });

// ✅ Fetch paginated products (with optional filters: search, category, isActive, page, limit)
const getAllProducts = (params = {}) => api.get('/admin/products', { params });

// ✅ Fetch analytics data for charting (period: '7d' | '30d' | '90d' | '1y')
const getSalesAnalytics = (period = '30d') =>
  api.get('/admin/analytics/sales', { params: { period } });

const adminService = {
  getDashboardStats,
  getAllOrders,
  getAllProducts,
  getSalesAnalytics,
};

export default adminService;
