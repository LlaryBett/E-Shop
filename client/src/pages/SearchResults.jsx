import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, X, ShoppingCart, Heart, Star, Filter, SlidersHorizontal } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import toast from 'react-hot-toast';
import ProductService from '../services/productService';

const SearchResults = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState({ field: 'relevance', direction: 'desc' });
  const [categories, setCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 600]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    // Read search query from URL parameters
    const queryFromUrl = searchParams.get('query');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    } else {
      // If no search query, redirect to shop
      navigate('/shop');
      return;
    }

    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ProductService.getProducts(
          1,
          100,
          {},
          sortBy,
          queryFromUrl
        );

        if (!response.success) {
          throw new Error('Failed to fetch search results');
        }

        setProducts(response.products);
        setFilteredProducts(response.products);
        
        // Extract unique categories from search results
        const uniqueCategories = [...new Set(
          response.products
            .map(p => p.category?.name)
            .filter(Boolean)
        )];
        setCategories(uniqueCategories);
        
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError(err.message || 'Failed to load search results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams, navigate, sortBy]);

  // Filter products based on price range
  useEffect(() => {
    const filtered = products.filter(product => {
      const price = product.salePrice || product.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    setFilteredProducts(filtered);
  }, [products, priceRange]);

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

  const handleCategoryFilter = (category) => {
    navigate(`/shop?category=${encodeURIComponent(category)}`);
  };

  const resetFilters = () => {
    setPriceRange([0, 600]);
  };

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
      <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-4">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 overflow-x-auto py-1">
          <ol className="flex items-center space-x-2 text-xs md:text-sm whitespace-nowrap">
            <li>
              <Link to="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Home
              </Link>
            </li>
            <li><span className="text-gray-400 dark:text-gray-600">/</span></li>
            <li>
              <Link to="/shop" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Shop
              </Link>
            </li>
            <li><span className="text-gray-400 dark:text-gray-600">/</span></li>
            <li>
              <span className="text-gray-900 dark:text-white font-medium">
                Search: "{searchQuery}"
              </span>
            </li>
          </ol>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-0">
              Search Results for "{searchQuery}"
            </h1>
            
            {/* Desktop Sorting Control */}
            <div className="hidden lg:block w-64">
              <select
                value={`${sortBy.field}-${sortBy.direction}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-');
                  setSortBy({ field, direction });
                }}
                className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white w-full"
              >
                <option value="relevance-desc">Most Relevant</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="title-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Mobile Filter and Sort Buttons */}
          <div className="flex lg:hidden gap-2 mb-4">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <div className="relative flex-1">
            <select
              value={`${sortBy.field}-${sortBy.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortBy({ field, direction });
              }}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white direction-rtl"
            >
                <option value="relevance-desc">Most Relevant</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="title-asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="lg:flex lg:gap-6">
          {/* Desktop Sidebar Filters */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-32">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Reset
                </button>
              </div>
              
              {/* Price Range Slider */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Price Range: KES {priceRange[0]} - KES {priceRange[1]}
                </label>
                <div className="px-2">
                  <input
                    type="range"
                    min="0"
                    max="600"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-2"
                  />
                  <input
                    type="range"
                    min="0"
                    max="600"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>KES 0</span>
                    <span>KES 600</span>
                  </div>
                </div>
              </div>

              {/* Category Filters */}
              {categories.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className="block w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:flex-1">
            {/* Search metadata */}
            <div className="mb-6">
              <div className="text-gray-600 dark:text-gray-400 mb-4">
                Found {filteredProducts.length} results for "{searchQuery}"
              </div>

              {/* Category quick filters - only show on mobile/tablet */}
              {categories.length > 0 && (
                <div className="flex lg:hidden flex-wrap gap-2 mb-4">
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Categories:</span>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-800 dark:text-gray-200 transition-colors"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="mb-4">
                  <Search className="h-12 w-12 mx-auto text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No results found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We couldn't find any products matching "{searchQuery}" with your current filters
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/shop" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Browse all products
                  </Link>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {filteredProducts.map(product => (
    <div
      key={product._id}
      className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow h-full bg-white dark:bg-gray-900"
    >
      <div className="h-40 overflow-hidden relative">
        <Link to={`/product/${product._id}`}>
          <img 
            src={product.images?.[0]?.url || product.images?.[0] || ''}
            alt={product.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        </Link>
        {/* Discount Badge */}
        {product.salePrice && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
          </div>
        )}
      </div>
      
      <div className="px-3 pb-3 flex flex-col" style={{ minHeight: '120px' }}>
        <h3 className="font-medium text-gray-900 dark:text-white text-base leading-tight h-8 overflow-hidden">
          <Link to={`/product/${product._id}`} className="hover:text-blue-600 transition-colors">
            <span className="line-clamp-2">
              {product.title}
            </span>
          </Link>
        </h3>

        {/* Price Section */}
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

        <div className="flex-grow"></div>
        
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

        {/* Mobile Filter Modal */}
        {showMobileFilters && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden flex items-center justify-center p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Reset
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Price Range Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Price Range: KES {priceRange[0]} - KES {priceRange[1]}
          </label>
          <div className="px-2">
            <input
              type="range"
              min="0"
              max="600"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-3"
            />
            <input
              type="range"
              min="0"
              max="600"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>KES 0</span>
              <span>KES 600</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default SearchResults;