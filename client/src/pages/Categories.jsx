import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Filter, 
  Search, 
  Star, 
  ShoppingBag, 
  ChevronDown,
  X,
  Sliders,
  ArrowUpDown
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useCategories } from '../contexts/CategoryContext';

const Categories = () => {
  const { isDark } = useTheme();
  const { categories, loading } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    availability: 'all',
    rating: 'all',
    priceRange: 'all'
  });
  const navigate = useNavigate();

  const filteredCategories = categories
    .filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOption) {
        case 'popular':
          return b.popularity - a.popularity;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

  const applyFilters = (category) => {
    // Availability filter
    if (selectedFilters.availability !== 'all') {
      const isAvailable = selectedFilters.availability === 'in-stock' 
        ? category.productCount > 0 
        : category.productCount === 0;
      if (!isAvailable) return false;
    }

    // Rating filter
    if (selectedFilters.rating !== 'all') {
      const minRating = parseInt(selectedFilters.rating);
      if (category.averageRating < minRating) return false;
    }

    // Price range filter
    if (selectedFilters.priceRange !== 'all') {
      const [min, max] = selectedFilters.priceRange.split('-').map(Number);
      if (category.minPrice > max || category.maxPrice < min) return false;
    }

    return true;
  };

  const clearFilters = () => {
    setSelectedFilters({
      availability: 'all',
      rating: 'all',
      priceRange: 'all'
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className={`relative py-20 ${isDark ? 'bg-gray-800' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Shop by Categories
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explore our wide range of product categories to find exactly what you need
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Sort and Filter Buttons */}
            <div className="flex space-x-3 w-full md:w-auto">
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="newest">Newest</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 border rounded-xl flex items-center space-x-2 ${
                  showFilters || Object.values(selectedFilters).some(f => f !== 'all')
                    ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {Object.values(selectedFilters).some(f => f !== 'all') && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </button>
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className={`mt-4 p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Filters</h3>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear all
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Availability Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Availability</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Categories' },
                      { value: 'in-stock', label: 'In Stock' },
                      { value: 'out-of-stock', label: 'Out of Stock' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="availability"
                          value={option.value}
                          checked={selectedFilters.availability === option.value}
                          onChange={() => setSelectedFilters({...selectedFilters, availability: option.value})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Rating Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Ratings' },
                      { value: '4', label: '4 Stars & Up' },
                      { value: '3', label: '3 Stars & Up' },
                      { value: '2', label: '2 Stars & Up' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="rating"
                          value={option.value}
                          checked={selectedFilters.rating === option.value}
                          onChange={() => setSelectedFilters({...selectedFilters, rating: option.value})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Price Range Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Prices' },
                      { value: '0-100', label: 'Under $100' },
                      { value: '100-500', label: '$100 - $500' },
                      { value: '500-1000', label: '$500 - $1000' },
                      { value: '1000-5000', label: 'Above $1000' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="priceRange"
                          value={option.value}
                          checked={selectedFilters.priceRange === option.value}
                          onChange={() => setSelectedFilters({...selectedFilters, priceRange: option.value})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.filter(applyFilters).map((category) => (
              <div
                key={category._id || category.id}
                className={`group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } cursor-pointer`}
                onClick={() => {
                  
                  navigate(`/shop?category=${encodeURIComponent(category.slug)}`);
                }}
              >
                {/* Category Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image?.url || '/default-category.jpg'}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>
                
                {/* Category Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {category.description || `${category.productCount || 'Various'} products available`}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {category.averageRating?.toFixed(1) || '4.5'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ShoppingBag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {category.productCount || '100+'} items
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* View Button */}
                <div className="absolute bottom-5 right-5">
                  <button className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-md group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <X className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No categories found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't find any categories matching your search and filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                clearFilters();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear search & filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;