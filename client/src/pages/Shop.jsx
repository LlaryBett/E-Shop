import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Grid, List, Star, Heart, ShoppingCart, Shield, Award, RefreshCw, Truck, X } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import toast from 'react-hot-toast';
import ProductService from '../services/productService';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [sortBy, setSortBy] = useState({ field: 'createdAt', direction: 'desc' });
  const [filters, setFilters] = useState({
    categories: [],
    brands: [],
    priceRange: [0, 2000],
    rating: 0,
    inStock: false,
    onSale: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState({});

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Extract URL parameters
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  const name = searchParams.get('name');
  const query = searchParams.get('query'); // For search results
  const brandId = searchParams.get('brand'); // Add this line

  // Check for quality guarantee parameter and open modal
  useEffect(() => {
    const showQuality = searchParams.get('quality');
    if (showQuality === 'true') {
      setShowQualityModal(true);
      // Remove the parameter from URL after opening modal
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('quality');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Main product fetching effect
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('URL Parameters:', { category, subcategory, name, query });

        // Fetch all products from your API
        const response = await ProductService.getProducts(
          1, // page
          100, // limit
          {}, // empty filters - we'll filter client-side
          sortBy,
          query || '' // search query if exists
        );

        if (!response.success) {
          throw new Error('Failed to fetch products');
        }

        setProducts(response.products);

        // Extract categories and brands for filters (do this before filtering)
        const uniqueCategories = [...new Set(
          response.products
            .map(p => p.category?.name)
            .filter(Boolean)
        )];
        
        const brandMap = response.products.reduce((acc, product) => {
          if (product.brand?._id) {
            acc[product.brand._id] = product.brand.name;
          }
          return acc;
        }, {});

        setCategories(uniqueCategories);
        setBrands(brandMap);
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, subcategory, name, query, sortBy]); // Re-run when URL parameters change

  // Apply all filters (URL parameters + sidebar filters)
  // Update the filtering logic in your useEffect around line 120-180
  // Replace the existing filtering section with this:

  useEffect(() => {
    let filtered = [...products];

    // Apply URL-based filters first
    if (category) {
      filtered = filtered.filter(product => 
        product.category?.slug === category || 
        product.categorySlug === category ||
        product.category?.name?.toLowerCase().replace(/\s+/g, '-') === category
      );
    }

    if (subcategory) {
      filtered = filtered.filter(product => {
        // Check subcategory fields
        const subcategoryMatch = 
          product.subcategory?.slug === subcategory ||
          product.subcategorySlug === subcategory ||
          product.subcategory?.name?.toLowerCase().replace(/\s+/g, '-') === subcategory ||
          // Check if product has subcategories array
          product.subcategories?.some(sub => 
            sub.slug === subcategory || 
            sub.name?.toLowerCase().replace(/\s+/g, '-') === subcategory
          );

        // IMPORTANT: Also check the 'item' field which seems to be the actual product type
        const itemMatch = 
          product.item?.slug === subcategory ||
          product.item?.name?.toLowerCase().replace(/\s+/g, '-') === subcategory;

        return subcategoryMatch || itemMatch;
      });
    }

    // Add brand URL parameter filtering
    if (brandId) {
      filtered = filtered.filter(product => product.brand?._id === brandId);
    }

    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        product.brand?.name?.toLowerCase().includes(searchTerm) ||
        // Also search in item name
        product.item?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sidebar filters (rest remains the same)
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category?.name)
      );
    }

    // Update brand filter to work with both URL parameter and checkbox filters
    if (filters.brands.length > 0 || brandId) {
      filtered = filtered.filter(product => 
        filters.brands.includes(product.brand?._id) || 
        (brandId && product.brand?._id === brandId)
      );
    }

    if (filters.priceRange) {
      filtered = filtered.filter(product => {
        const price = product.salePrice || product.price;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    if (filters.rating > 0) {
      filtered = filtered.filter(product => 
        (product.rating || 0) >= filters.rating
      );
    }

    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    if (filters.onSale) {
      filtered = filtered.filter(product => product.salePrice);
    }

    // Apply sorting
    const sortedFiltered = [...filtered].sort((a, b) => {
      const { field, direction } = sortBy;
      let aValue, bValue;

      switch (field) {
        case 'price':
          aValue = a.salePrice || a.price;
          bValue = b.salePrice || b.price;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(sortedFiltered);
  }, [products, filters, sortBy, category, subcategory, query, brandId]); // Add brandId to dependencies

  // Get breadcrumbs based on URL parameters
  const getBreadcrumbs = () => {
    const crumbs = [
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' }
    ];

    if (category) {
      const categoryName = category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      crumbs.push({
        name: categoryName,
        path: `/shop?category=${category}`
      });
    }

    if (subcategory) {
      const subcategoryName = subcategory.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      crumbs.push({
        name: subcategoryName,
        path: `/shop?category=${category}&subcategory=${subcategory}`
      });
    }

    return crumbs;
  };

  // Get page title based on URL parameters
  const getPageTitle = () => {
    if (name) return name;
    if (subcategory) {
      return subcategory.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    if (category) {
      return category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    if (query) return `Search results for "${query}"`;
    return 'All Products';
  };

  // Handler functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryFilter = (categoryName) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(categoryName)
      ? currentCategories.filter(c => c !== categoryName)
      : [...currentCategories, categoryName];
    handleFilterChange('categories', newCategories);
  };

  const handleBrandFilter = (brandId) => {
    const currentBrands = filters.brands || [];
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter(b => b !== brandId)
      : [...currentBrands, brandId];
    handleFilterChange('brands', newBrands);
    
    // Update URL when brand filter changes
    const newSearchParams = new URLSearchParams(searchParams);
    if (newBrands.length === 1) {
      newSearchParams.set('brand', newBrands[0]);
    } else {
      newSearchParams.delete('brand');
    }
    setSearchParams(newSearchParams);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success('Added to wishlist!');
    }
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      priceRange: [0, 2000],
      rating: 0,
      inStock: false,
      onSale: false,
    });
    setSearchQuery('');
    const newSearchParams = new URLSearchParams();
    setSearchParams(newSearchParams);
  };

  // Lock body scroll when filters are open on mobile
  useEffect(() => {
    if (showFilters && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [showFilters]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36 lg:pt-24">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36 lg:pt-24">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-4">
        {/* Updated Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            {getBreadcrumbs().map((crumb, index) => (
              <li key={index} className="flex items-center space-x-2">
                {index > 0 && <span className="text-gray-400">/</span>}
                {index === getBreadcrumbs().length - 1 ? (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Category Header with improved styling for context-loaded products */}
        {searchParams.get('name') && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchParams.get('name')}
                </h1>
                {searchParams.get('parent') && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {searchParams.get('parent')} • {searchParams.get('name')}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {filteredProducts.length} products available
                </p>
              </div>
              
              {/* Add a badge to indicate if products were loaded via context */}
              {searchParams.get('parent') && (
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                  Specialized Collection
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex items-center flex-wrap gap-2 w-full">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex items-center space-x-4 flex-wrap">
                  {/* Updated Select with width-controlling container */}
                  <div className="flex-1 min-w-0">
                    <select
                      value={`${sortBy.field}-${sortBy.direction}`}
                      onChange={(e) => {
                        const [field, direction] = e.target.value.split('-');
                        setSortBy({ field, direction });
                      }}
                      className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full"
                    >
                      <option value="createdAt-desc">Newest First</option>
                      <option value="createdAt-asc">Oldest First</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="rating-desc">Highest Rated</option>
                      <option value="title-asc">Name: A to Z</option>
                    </select>
                  </div>

                  <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shrink-0">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shrink-0"
                    aria-expanded={showFilters}
                    aria-controls="filter-sidebar"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

     

{/* Mobile Backdrop */}
{showFilters && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    onClick={() => setShowFilters(false)}
  />
)}

{/* Floating Filter Button - Only visible on mobile/tablet */}
<div className="lg:hidden">
  <button
    onClick={() => setShowFilters(true)}
    className="fixed bottom-6 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
  >
    <div className="relative">
      <Filter className="h-6 w-6" />
      {/* Active filters badge */}
      {(filters.categories?.length > 0 || 
        filters.brands?.length > 0 || 
        filters.rating > 0 || 
        filters.inStock || 
        filters.onSale || 
        (filters.priceRange && filters.priceRange[1] < 2000)
       ) && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {[
            ...(filters.categories || []),
            ...(filters.brands || []),
            filters.rating > 0 ? 1 : 0,
            filters.inStock ? 1 : 0,
            filters.onSale ? 1 : 0,
            (filters.priceRange && filters.priceRange[1] < 2000) ? 1 : 0
          ].filter(Boolean).length}
        </div>
      )}
    </div>
  </button>
</div>

<div className="flex gap-8">
  {/* Desktop Sidebar - Hidden on mobile, visible on lg+ */}
  <div className="hidden lg:block w-64">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md sticky top-28">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear All
        </button>
      </div>

      {/* Desktop Filter Content */}
      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Categories</h4>
          <div className="space-y-2">
            {categories.map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category) || false}
                  onChange={() => handleCategoryFilter(category)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Brands</h4>
          <div className="space-y-2">
            {Object.entries(brands).map(([brandId, brandName]) => (
              <label key={brandId} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.brands?.includes(brandId) || false}
                  onChange={() => handleBrandFilter(brandId)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{brandName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Price Range</h4>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="2000"
              value={filters.priceRange?.[1] || 2000}
              onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Ksh 0</span>
              <span>Ksh {filters.priceRange?.[1] || 2000}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Minimum Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.rating === rating}
                  onChange={() => handleFilterChange('rating', rating)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-2 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">& up</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Filters */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.inStock || false}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.onSale || false}
              onChange={(e) => handleFilterChange('onSale', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">On Sale</span>
          </label>
        </div>
      </div>
    </div>
  </div>

  {/* Mobile Bottom Drawer */}
  <div 
    className={`
      lg:hidden fixed inset-x-0 bottom-0 z-50
      transform transition-transform duration-300 ease-out
      ${showFilters ? 'translate-y-0' : 'translate-y-full'}
    `}
  >
    <div className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col mx-4 mb-4">
      {/* Drawer Handle */}
      <div className="flex items-center justify-center py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>

      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
            {filteredProducts.length} products
          </span>
        </div>
        <button
          onClick={() => setShowFilters(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Scrollable Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Active Filters Summary */}
        {(filters.categories?.length > 0 || 
          filters.brands?.length > 0 || 
          filters.rating > 0 || 
          filters.inStock || 
          filters.onSale || 
          (filters.priceRange && filters.priceRange[1] < 2000)
         ) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Active Filters</span>
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.categories?.map(cat => (
                <span key={cat} className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                  {cat}
                </span>
              ))}
              {filters.brands?.map(brandId => (
                <span key={brandId} className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                  {brands[brandId]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            Categories
            {filters.categories?.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {filters.categories.length}
              </span>
            )}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {categories.map(category => (
              <label key={category} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category) || false}
                  onChange={() => handleCategoryFilter(category)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            Brands
            {filters.brands?.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {filters.brands.length}
              </span>
            )}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(brands).map(([brandId, brandName]) => (
              <label key={brandId} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={filters.brands?.includes(brandId) || false}
                  onChange={() => handleBrandFilter(brandId)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{brandName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Price Range: Ksh 0 - {filters.priceRange?.[1] || 2000}
          </h4>
          <div className="space-y-3">
            <input
              type="range"
              min="0"
              max="2000"
              value={filters.priceRange?.[1] || 2000}
              onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb:bg-blue-600"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Ksh 0</span>
              <span>Ksh 2000</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Minimum Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.rating === rating}
                  onChange={() => handleFilterChange('rating', rating)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">& up</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Other Options</h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <span className="text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
              <input
                type="checkbox"
                checked={filters.inStock || false}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <span className="text-sm text-gray-700 dark:text-gray-300">On Sale</span>
              <input
                type="checkbox"
                checked={filters.onSale || false}
                onChange={(e) => handleFilterChange('onSale', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex gap-3">
          <button
            onClick={clearFilters}
            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            Reset
          </button>
          <button
            onClick={() => setShowFilters(false)}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <span>View {filteredProducts.length} Products</span>
          </button>
        </div>
      </div>
    </div>
  </div>

 

          {/* Products Display */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Showing {filteredProducts.length} products
                {searchParams.get('parent') && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                    from {searchParams.get('parent')}
                  </span>
                )}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchParams.get('name') 
                    ? `No ${searchParams.get('name')} products found` 
                    : 'No products found'
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-4'
              }>
                {filteredProducts.map(product => (
                  <div
                    key={product._id}
                    className={`border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900 ${
                      viewMode === 'list' ? 'flex' : 'flex flex-col h-full'
                    }`}
                  >
                    {/* Product Image */}
                    <Link to={`/product/${product._id}`} className={viewMode === 'list' ? 'flex-shrink-0' : ''}>
                      <div className={`${viewMode === 'list' ? 'w-32 sm:w-48 aspect-square' : 'aspect-square'} overflow-hidden relative`}>
                        <img
                          src={product.images[0]?.url || 'https://via.placeholder.com/300'}
                          alt={product.title}
                          className={`w-full ${viewMode === 'list' ? 'h-full' : 'h-48'} object-cover ${viewMode === 'grid' ? 'rounded-t-lg' : ''}`}
                        />
                        {/* Discount Badge */}
                        {product.salePrice && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    {/* Product Info + Buttons Container */}
                    <div className={`p-3 flex flex-col ${
                      viewMode === 'list' ? 'flex-1' : 'h-full'
                    }`} style={viewMode === 'grid' ? { minHeight: '160px' } : {}}>
                      {/* Product Details */}
                      <div className="flex-grow">
                        <Link to={`/product/${product._id}`}>
                          {/* Product Name - Two lines with second line truncation */}
                          <h3 className="font-medium text-gray-900 dark:text-white text-base leading-tight h-10 overflow-hidden hover:text-blue-600 transition-colors mb-1">
                            <span className="line-clamp-2">
                              {product.title}
                            </span>
                          </h3>
                        </Link>

                        {/* Price Section - Reduced top margin */}
                        <div className="mt-1">
                          <div className="flex items-baseline">
                            <p className="text-red-600 font-bold text-base">
                              KES {product.salePrice || product.price}
                            </p>
                            {product.salePrice && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 line-through ml-2">
                                KES {product.price}
                              </span>
                            )}
                          </div>
                          {product.salePrice && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                              Save KES {Math.floor(product.price - product.salePrice)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Buttons Container */}
                      <div className="flex items-center gap-0.5 sm:gap-1 mt-1 pt-1">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-[0.85] px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 sm:space-x-2"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Add to Cart</span>
                        </button>
                        <button
                          onClick={() => handleWishlistToggle(product)}
                          className={`flex-[0.15] p-1.5 sm:p-2 rounded-lg border transition-colors ${
                            isInWishlist(product._id)
                              ? 'bg-red-50 border-red-200 text-red-600'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          } flex items-center justify-center`}
                        >
                          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isInWishlist(product._id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quality Guarantee Modal - Same as before */}
      {showQualityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Quality Promise</h2>
              </div>
              <button
                onClick={() => setShowQualityModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content - Same as original */}
            <div className="p-6 space-y-6">
              {/* Hero Section */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Premium Quality Products with 30-Day Money-Back Guarantee
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We stand behind every product we sell with our comprehensive quality promise
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Premium Quality</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Every product is carefully selected and tested to meet our high quality standards
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">30-Day Returns</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Not satisfied? Return any item within 30 days for a full refund
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Warranty Protection</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      All products come with manufacturer warranty and our additional protection
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                    <Truck className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Free Shipping & Returns</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Enjoy free shipping on orders over Ksh 2,000 and free return shipping
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Promise */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Our Commitment to You</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Every product undergoes rigorous quality inspection before shipping</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>We partner only with trusted brands and verified suppliers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Fast and responsive customer support for any issues</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Secure payment processing and data protection</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 font-bold">•</span>
                    <span>Regular quality audits and continuous improvement</span>
                  </li>
                </ul>
              </div>

              {/* Return Policy */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Easy Return Process</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-1">1</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Contact us within 30 days</p>
                  </div>
                  <div>
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-1">2</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Get free return shipping label</p>
                  </div>
                  <div>
                    <div className="text-blue-600 dark:text-blue-400 font-bold text-lg mb-1">3</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Receive full refund in 3-5 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Have questions about our quality guarantee? Contact our support team anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowQualityModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Got it, thanks!
                </button>
                <Link
                  to="/contact"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setShowQualityModal(false)}
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;