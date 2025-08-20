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

// Product Management
const createProduct = (data) => api.post('/products', data);
const updateProduct = (id, data) => api.put(`/products/${id}`, data);
const deleteProduct = (id) => api.delete(`/products/${id}`);
const getProduct = (id) => api.get(`/products/${id}`);

// Category Management
const getCategories = () => api.get('/categories');
const getCategory = (id) => api.get(`/categories/${id}`);
const createCategory = (data) => api.post('/categories', data);
const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Brand Management
const getBrands = () => api.get('/brands');
const getBrand = (id) => api.get(`/brands/${id}`);
const createBrand = (data) => api.post('/brands', data);
const updateBrand = (id, data) => api.put(`/brands/${id}`, data);
const deleteBrand = (id) => api.delete(`/brands/${id}`);

// Add these to adminService
const uploadProductImages = (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  return api.post('/upload/images', formData, {  // '/upload/images' not '/uploads/images'
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
};

const adminService = {
  getDashboardStats,
  getAllOrders,
  getAllProducts,
  getSalesAnalytics,
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadProductImages,
};

export default adminService;
