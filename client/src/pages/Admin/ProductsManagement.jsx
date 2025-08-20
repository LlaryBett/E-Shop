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
  Star,
  Tag,
  Package,
  ArrowUpDown,
  Upload,
  Image as ImageIcon,
  Save,
  AlertCircle
} from 'lucide-react';
import adminService from '../../services/adminService'; // adjust path if needed
import * as XLSX from 'xlsx';

const ProductModal = ({ 
  isEdit = false,
  formData,
  formErrors,
  modalLoading,
  categories,
  categoriesLoading,
  brands,
  brandsLoading,
  subcategories,
  items,
  handleFormChange,
  handleImageChange,
  removeImage,
  imagePreview,
  setShowAddModal,
  setShowEditModal,
  setEditingProduct,
  resetForm,
  submitAddProduct,
  submitEditProduct
}) => {
  const renderCategoryOptions = () => {
    if (!Array.isArray(categories)) {
      return <option value="">No categories available</option>;
    }
    return [
      <option key="empty" value="">Select Category</option>,
      ...categories.map(cat => (
        <option key={cat._id} value={cat._id}>{cat.name}</option>
      ))
    ];
  };

  const renderBrandOptions = () => {
    if (!Array.isArray(brands)) {
      return <option value="">No brands available</option>;
    }
    return [
      <option key="empty" value="">Select Brand</option>,
      ...brands.map(brand => (
        <option key={brand._id} value={brand._id}>{brand.name}</option>
      ))
    ];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button 
            onClick={() => {
              if (isEdit) {
                setShowEditModal(false);
                setEditingProduct(null);
              } else {
                setShowAddModal(false);
              }
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            disabled={modalLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h4>
              
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formErrors.title ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter product name"
                  disabled={modalLoading}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formErrors.sku ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter SKU"
                  disabled={modalLoading}
                />
                {formErrors.sku && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.sku}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="4"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter product description"
                  disabled={modalLoading}
                />
              </div>
            </div>

            {/* Pricing and Inventory */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Pricing & Inventory</h4>
              
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Regular Price (Ksh) *
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  value={formData.price}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formErrors.price ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                  disabled={modalLoading}
                />
                {formErrors.price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.price}
                  </p>
                )}
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sale Price (Ksh)
                </label>
                <input
                  type="number"
                  name="salePrice"
                  step="0.01"
                  value={formData.salePrice}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00 (optional)"
                  disabled={modalLoading}
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleFormChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    formErrors.stock ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0"
                  disabled={modalLoading}
                />
                {formErrors.stock && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {formErrors.stock}
                  </p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={modalLoading}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="out-of-stock">Out of Stock</option>
                  <option value="low-stock">Low Stock</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="electronics, smartphone, mobile (comma separated)"
                  disabled={modalLoading}
                />
              </div>
            </div>
          </div>

          {/* Category Hierarchy */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.category ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={categoriesLoading}
              >
                {categoriesLoading ? (
                  <option value="">Loading categories...</option>
                ) : (
                  renderCategoryOptions()
                )}
              </select>
              {formErrors.category && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subcategory *
              </label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.subcategory ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={!formData.category}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map(sub => (
                  <option key={sub._id} value={sub._id}>{sub.name}</option>
                ))}
              </select>
              {formErrors.subcategory && (
                <p className="mt-1 text-sm text-red-600">{formErrors.subcategory}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item *
              </label>
              <select
                name="item"
                value={formData.item}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.item ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={!formData.subcategory}
              >
                <option value="">Select Item</option>
                {items.map(item => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
              {formErrors.item && (
                <p className="mt-1 text-sm text-red-600">{formErrors.item}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand *
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleFormChange}
                className={`w-full px-3 py-2 border rounded-lg ${
                  formErrors.brand ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={brandsLoading}
              >
                {brandsLoading ? (
                  <option value="">Loading brands...</option>
                ) : (
                  renderBrandOptions()
                )}
              </select>
              {formErrors.brand && (
                <p className="mt-1 text-sm text-red-600">{formErrors.brand}</p>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                step="0.01"
                value={formData.weight}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                disabled={modalLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dimensions
              </label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="L x W x H (cm)"
                disabled={modalLoading}
              />
            </div>
          </div>

          {/* Featured and Trending Toggles */}
          <div className="flex space-x-4 mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={(e) => handleFormChange({
                  target: { name: 'featured', value: e.target.checked }
                })}
                className="rounded border-gray-300"
              />
              <span className="ml-2">Featured</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="trending"
                checked={formData.trending}
                onChange={(e) => handleFormChange({
                  target: { name: 'trending', value: e.target.checked }
                })}
                className="rounded border-gray-300"
              />
              <span className="ml-2">Trending</span>
            </label>
          </div>

          {/* Product Images */}
          <div className="space-y-4 mb-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Product Images</h4>
            
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Images (Max 5)
              </label>
              
              {/* Image Preview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {imagePreview.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              {formData.images.length < 5 && (
                <div className="flex items-center justify-center w-full">
                  <label className="w-full flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-700 text-gray-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">Click to upload images</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={formData.images.length >= 5}
                    />
                  </label>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supported formats: JPG, PNG, WEBP. Max 5 images.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                if (isEdit) {
                  setShowEditModal(false);
                  setEditingProduct(null);
                } else {
                  setShowAddModal(false);
                }
                resetForm();
              }}
              disabled={modalLoading}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={isEdit ? submitEditProduct : submitAddProduct}
              disabled={modalLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {modalLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEdit ? 'Update Product' : 'Create Product'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductsManagement = () => {
  // Backend product data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Updated form state to match backend requirements
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    salePrice: '',
    images: [],
    category: '',
    subcategory: '',
    item: '',
    brand: '',
    rating: 0,
    reviewCount: 0,
    stock: '',
    tags: '',
    variants: [],
    featured: false,
    trending: false,
    sku: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Add states for category hierarchy
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Update brands state and loading state
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  // Image upload state
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminService.getAllProducts().then(res => {
      setProducts(res.data.products || res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Update categories fetch
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await adminService.getCategories();
        // Extract the data array from the response
        const categoriesData = response?.data?.data || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Update brands fetch
  useEffect(() => {
    const fetchBrands = async () => {
      setBrandsLoading(true);
      try {
        const response = await adminService.getBrands();
        // Extract the data array from the response
        const brandsData = response?.data?.data || [];
        setBrands(brandsData);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(cat => 
        cat._id === formData.category || cat.name === formData.category
      );
      setSubcategories(selectedCategory?.subcategories || []);
      setFormData(prev => ({ ...prev, subcategory: '', item: '' }));
    }
  }, [formData.category, categories]);

  // Update items when subcategory changes
  useEffect(() => {
    if (formData.subcategory) {
      const selectedSubcategory = subcategories.find(sub => 
        sub._id === formData.subcategory || sub.name === formData.subcategory
      );
      setItems(selectedSubcategory?.items || []);
      setFormData(prev => ({ ...prev, item: '' }));
    }
  }, [formData.subcategory, subcategories]);

  // Get unique categories for filter dropdown
  const categoryOptions = ['all', ...new Set(products.map(product => product.category?.name || product.category || ''))];
  const statusOptions = ['all', 'active', 'out-of-stock', 'low-stock', 'draft'];

  // Filter products based on search term, category, and status
  const filteredProducts = products.filter(product => {
    const name = product.title || product.name || '';
    const sku = product.sku || '';
    const category = product.category?.name || product.category || '';
    const status = product.status || (product.isActive === false ? 'draft' : 'active');
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
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
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Reset form data
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      salePrice: '',
      images: [],
      category: '',
      subcategory: '',
      item: '',
      brand: '',
      rating: 0,
      reviewCount: 0,
      stock: '',
      tags: '',
      variants: [],
      featured: false,
      trending: false,
      sku: ''
    });
    setFormErrors({});
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Product name is required';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.subcategory) errors.subcategory = 'Subcategory is required';
    if (!formData.item) errors.item = 'Item is required';
    if (!formData.brand) errors.brand = 'Brand is required';
    if (!formData.stock || parseInt(formData.stock) < 0) errors.stock = 'Valid stock quantity is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add product
  const handleAddProduct = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || product.name || '',
      description: product.description || '',
      sku: product.sku || '',
      category: product.category?.name || product.category || '',
      subcategory: product.subcategory?.name || product.subcategory || '',
      item: product.item?.name || product.item || '',
      brand: product.brand?.name || product.brand || '',
      price: product.price || '',
      salePrice: product.salePrice || '',
      stock: product.stock || '',
      status: product.status || (product.isActive === false ? 'draft' : 'active'),
      images: product.images || [],
      tags: product.tags?.join(', ') || '',
      weight: product.weight || '',
      dimensions: product.dimensions || ''
    });
    setShowEditModal(true);
  };

  // Add image upload state
  const [imagePreview, setImagePreview] = useState([]);
  
  // Add image handling functions
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    setImageUploading(true);
    
    try {
      const uploadResponse = await adminService.uploadProductImages(files);
      const uploadedUrls = uploadResponse.data.urls || uploadResponse.data.images || [];
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreview(prev => [...prev, ...newPreviews]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setFormErrors(prev => ({
        ...prev,
        images: 'Failed to upload images'
      }));
    }
    
    setImageUploading(false);
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(imagePreview[index]);
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Submit add product
  const submitAddProduct = async () => {
    if (!validateForm()) return;

    setModalLoading(true);
    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        stock: parseInt(formData.stock),
        category: formData.category,
        subcategory: formData.subcategory,
        item: formData.item,
        brand: formData.brand,
        sku: formData.sku,
        images: formData.images,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        featured: formData.featured,
        trending: formData.trending,
        status: formData.status || 'active'
      };

      const response = await adminService.createProduct(productData);
      setProducts(prev => [response.data.product || response.data, ...prev]);
      setShowAddModal(false);
      resetForm();
      setImagePreview([]);
    } catch (error) {
      console.error('Error adding product:', error);
      if (error.response?.data?.message) {
        setFormErrors(prev => ({
          ...prev,
          submitError: error.response.data.message
        }));
      }
    }
    setModalLoading(false);
  };

  // Submit edit product
  const submitEditProduct = async () => {
    if (!validateForm()) return;

    setModalLoading(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        stock: parseInt(formData.stock),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      const response = await adminService.updateProduct(editingProduct._id || editingProduct.id, productData);
      setProducts(prev => prev.map(p => 
        (p._id || p.id) === (editingProduct._id || editingProduct.id) ? response.data : p
      ));
      setShowEditModal(false);
      setEditingProduct(null);
      resetForm();
      // Show success message
    } catch (error) {
      console.error('Error updating product:', error);
      // Show error message
    }
    setModalLoading(false);
  };

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

  // Delete product
  const handleDelete = (id) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await adminService.deleteProduct(productToDelete);
      setProducts(products.filter(product => (product._id || product.id) !== productToDelete));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  // Export products to Excel
  const handleExportProducts = () => {
    const columns = [
      'ID',
      'Name',
      'SKU',
      'Category',
      'Price',
      'Stock',
      'Status',
      'Created'
    ];

    const exportData = filteredProducts.map(product => ({
      ID: product._id || product.id || 'N/A',
      Name: product.title || product.name || 'N/A',
      SKU: product.sku || 'N/A',
      Category: product.category?.name || product.category || 'N/A',
      Price: product.salePrice != null
        ? product.salePrice.toFixed(2)
        : (product.price != null ? product.price.toFixed(2) : 'N/A'),
      Stock: product.stock != null ? product.stock : 'N/A',
      Status: product.status || (product.isActive === false ? 'Draft' : 'Active'),
      Created: product.createdAt ? new Date(product.createdAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData, { header: columns });
    XLSX.utils.sheet_add_aoa(worksheet, [columns], { origin: "A1" });

    worksheet['!cols'] = [
      { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 22 },
      { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 28 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'products.xlsx');
  };

  // Get status color and text
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', text: 'Active' };
      case 'out-of-stock':
        return { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', text: 'Out of Stock' };
      case 'low-stock':
        return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', text: 'Low Stock' };
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', text: 'Draft' };
      default:
        return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', text: status };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Product Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your product inventory, pricing, and details
          </p>
        </div>
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
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
                placeholder="Search products by name or SKU..."
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
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.filter(cat => cat !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Sliders className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
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
                  {statusOptions.filter(status => status !== 'all').map(status => (
                    <option key={status} value={status}>
                      {getStatusInfo(status).text}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Tag className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                onClick={handleExportProducts}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.filter(cat => cat !== 'all').map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
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
                  {statusOptions.filter(status => status !== 'all').map(status => (
                    <option key={status} value={status}>
                      {getStatusInfo(status).text}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
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
                      <span>Product</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('category')}
                      className="flex items-center space-x-1"
                    >
                      <span>Category</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('price')}
                      className="flex items-center space-x-1"
                    >
                      <span>Price</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('stock')}
                      className="flex items-center space-x-1"
                    >
                      <span>Stock</span>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.length > 0 ? (
                  currentItems.map(product => (
                    <tr key={product._id || product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={product.images?.[0]?.url || product.image || 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                            alt={product.title || product.name} 
                            className="w-10 h-10 object-cover rounded-lg mr-3" 
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                              {product.title || product.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                        {product.category?.name || product.category || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        Ksh {product.salePrice?.toFixed(2) ?? product.price?.toFixed(2) ?? '0.00'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.stock ?? '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(product.status || (product.isActive === false ? 'draft' : 'active')).color}`}>
                          {getStatusInfo(product.status || (product.isActive === false ? 'draft' : 'active')).text}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/products/${product._id || product.id}`}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id || product.id)}
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
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400 mb-2" />
                        <p>No products found matching your criteria</p>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('all');
                            setSelectedStatus('all');
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
                  {Math.min(indexOfLastItem, filteredProducts.length)}
                </span>{' '}
                of <span className="font-medium">{filteredProducts.length}</span> results
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

      {/* Add Product Modal */}
      {showAddModal && (
        <ProductModal 
          isEdit={false}
          formData={formData}
          formErrors={formErrors}
          modalLoading={modalLoading}
          categories={categories}
          categoriesLoading={categoriesLoading}
          brands={brands}
          brandsLoading={brandsLoading}
          subcategories={subcategories}
          items={items}
          handleFormChange={handleFormChange}
          handleImageChange={handleImageChange}
          removeImage={removeImage}
          imagePreview={imagePreview}
          setShowAddModal={setShowAddModal}
          setShowEditModal={setShowEditModal}
          setEditingProduct={setEditingProduct}
          resetForm={resetForm}
          submitAddProduct={submitAddProduct}
          submitEditProduct={submitEditProduct}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <ProductModal 
          isEdit={true}
          formData={formData}
          formErrors={formErrors}
          modalLoading={modalLoading}
          categories={categories}
          categoriesLoading={categoriesLoading}
          brands={brands}
          brandsLoading={brandsLoading}
          subcategories={subcategories}
          items={items}
          handleFormChange={handleFormChange}
          handleImageChange={handleImageChange}
          removeImage={removeImage}
          imagePreview={imagePreview}
          setShowAddModal={setShowAddModal}
          setShowEditModal={setShowEditModal}
          setEditingProduct={setEditingProduct}
          resetForm={resetForm}
          submitAddProduct={submitAddProduct}
          submitEditProduct={submitEditProduct}
        />
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
                Are you sure you want to delete this product? This action cannot be undone.
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

export default ProductsManagement;