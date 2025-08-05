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
  const [brands, setBrands] = useState({}); // Changed to object for brand mapping

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

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

  useEffect(() => {
    // Read category or filter from URL query params
    const categoryFromUrl = searchParams.get('category');
    const filterFromUrl = searchParams.get('filter');
    let filtersToSend = { ...filters };

    // If filter is present in URL, map it to categories or handle special cases
    if (filterFromUrl) {
      if (filterFromUrl === 'promos') {
        filtersToSend.categories = ['Promos'];
      } else if (filterFromUrl === 'food-cupboard') {
        filtersToSend.categories = ['Food Cupboard'];
      } else if (filterFromUrl === 'electronics') {
        filtersToSend.categories = ['Electronics'];
      } else if (filterFromUrl === 'home-garden') {
        filtersToSend.categories = ['Home & Garden'];
      } else if (filterFromUrl === 'voucher') {
        filtersToSend.categories = ['Voucher'];
      } else if (filterFromUrl === 'fashion') {
        filtersToSend.categories = ['Fashion'];
      }
    } else if (categoryFromUrl) {
      filtersToSend.categories = [categoryFromUrl];
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ProductService.getProducts(
          1,
          100,
          filtersToSend,
          sortBy,
          searchQuery
        );

        if (!response.success) {
          throw new Error('Failed to fetch products');
        }

        setProducts(response.products);

        // Apply local filtering if a filter is set (to handle backend not filtering)
        let filtered = response.products;
        if (filtersToSend.categories && filtersToSend.categories.length > 0) {
          filtered = filtered.filter(
            p => filtersToSend.categories.includes(p.category?.name)
          );
        }
        setFilteredProducts(filtered);

        // Extract unique categories
        const uniqueCategories = [...new Set(
          response.products
            .map(p => p.category?.name)
            .filter(Boolean)
        )];
        // Create brand mapping {id: name}
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
        setError(err.message || 'Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, sortBy, searchQuery, searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCategoryFilter = (category) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    handleFilterChange('categories', newCategories);
  };

  const handleBrandFilter = (brandId) => {
    const currentBrands = filters.brands || [];
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter(b => b !== brandId)
      : [...currentBrands, brandId];
    handleFilterChange('brands', newBrands);
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
    setSearchParams({});
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36 lg:pt-24">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-36 lg:pt-24">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-0">Shop</h1>
            
            {/* Quality Guarantee Banner */}
            {/* <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quality Guarantee</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Premium quality with 30-day money-back guarantee</p>
                </div>
                <button
                  onClick={() => setShowQualityModal(true)}
                  className="text-xs text-yellow-600 dark:text-yellow-400 font-medium hover:underline whitespace-nowrap"
                >
                  Our Promise →
                </button>
              </div>
            </div> */}
          </div>
          
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
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}

        <div className="flex gap-8">
          <div 
            id="filter-sidebar"
            className={`
              fixed lg:static inset-y-0 left-0 z-40 w-4/5 max-w-sm lg:w-64
              transform ${showFilters ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
              transition-transform duration-300 ease-in-out
              bg-white dark:bg-gray-800 shadow-xl lg:shadow-none
              overflow-y-auto
              space-y-6
            `}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md lg:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              <div className="mb-6">
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

              <div className="mb-6">
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

              <div className="mb-6">
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

              <div className="mb-6">
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

          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Showing {filteredProducts.length} products
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 text-lg">No products found</p>
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

      {/* Quality Guarantee Modal */}
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

            {/* Modal Content */}
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