import React, { useState } from 'react';
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
  Tag,
  Layers,
  Package,
  ArrowUpDown,
  List,
  Grid
} from 'lucide-react';
import { mockProducts, categories } from '../../data/mockData';

const CategoryManagement = () => {
  // State for categories
  const [categoryList, setCategoryList] = useState(categories);
  const [subcategories, setSubcategories] = useState({
    'Electronics': ['Audio', 'Wearables', 'Photography', 'Accessories', 'Gaming'],
    'Clothing': ['T-Shirts', 'Pants', 'Jackets', 'Shoes'],
    'Home & Kitchen': ['Drinkware', 'Cookware', 'Appliances'],
    'Sports & Fitness': ['Yoga', 'Running', 'Cycling'],
    'Home & Garden': ['Lighting', 'Furniture', 'Decor'],
    'Accessories': ['Bags', 'Watches', 'Jewelry']
  });

  // State for new category/subcategory
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Get product counts for each category
  const getProductCounts = () => {
    const counts = {};
    categoryList.forEach(category => {
      counts[category] = mockProducts.filter(product => product.category === category).length;
    });
    return counts;
  };

  const productCounts = getProductCounts();

  // Filter categories based on search term
  const filteredCategories = categoryList.filter(category => 
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortConfig.key === 'name') {
      if (a < b) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a > b) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    } else if (sortConfig.key === 'products') {
      const countA = productCounts[a] || 0;
      const countB = productCounts[b] || 0;
      if (countA < countB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (countA > countB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    return 0;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);

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

  // Add new category
  const handleAddCategory = () => {
    if (newCategory && !categoryList.includes(newCategory)) {
      setCategoryList([...categoryList, newCategory]);
      setSubcategories({...subcategories, [newCategory]: []});
      setNewCategory('');
      setShowAddCategoryModal(false);
    }
  };

  // Add new subcategory
  const handleAddSubcategory = () => {
    if (selectedCategoryForSub && newSubcategory && 
        !subcategories[selectedCategoryForSub]?.includes(newSubcategory)) {
      setSubcategories({
        ...subcategories,
        [selectedCategoryForSub]: [...(subcategories[selectedCategoryForSub] || []), newSubcategory]
      });
      setNewSubcategory('');
      setSelectedCategoryForSub('');
      setShowAddSubcategoryModal(false);
    }
  };

  // Delete category
  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      setCategoryList(categoryList.filter(cat => cat !== categoryToDelete));
      const updatedSubcategories = {...subcategories};
      delete updatedSubcategories[categoryToDelete];
      setSubcategories(updatedSubcategories);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  // Delete subcategory
  const deleteSubcategory = (category, subcategory) => {
    setSubcategories({
      ...subcategories,
      [category]: subcategories[category].filter(sub => sub !== subcategory)
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Category Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organize your products with categories and subcategories
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={viewMode === 'list' ? 'Grid View' : 'List View'}
          >
            {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
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
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddSubcategoryModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Layers className="h-4 w-4" />
                <span>Add Subcategory</span>
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Display */}
        {viewMode === 'list' ? (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('name')}
                      className="flex items-center space-x-1"
                    >
                      <span>Category</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button 
                      onClick={() => requestSort('products')}
                      className="flex items-center space-x-1"
                    >
                      <span>Products</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subcategories
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.length > 0 ? (
                  currentItems.map(category => (
                    <tr key={category} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {category}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                          {productCounts[category] || 0} products
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {subcategories[category]?.length > 0 ? (
                            subcategories[category].map(subcategory => (
                              <div key={`${category}-${subcategory}`} className="flex items-center">
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs flex items-center">
                                  {subcategory}
                                  <button 
                                    onClick={() => deleteSubcategory(category, subcategory)}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">No subcategories</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/categories/${encodeURIComponent(category)}`}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="View Products"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedCategoryForSub(category);
                              setShowAddSubcategoryModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Add Subcategory"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
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
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <Tag className="h-12 w-12 text-gray-400 mb-2" />
                        <p>No categories found matching your criteria</p>
                        <button 
                          onClick={() => {
                            setSearchTerm('');
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
          </div>
        ) : (
          /* Grid View */
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.length > 0 ? (
              currentItems.map(category => (
                <div key={category} className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {category}
                        </h3>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs">
                        {productCounts[category] || 0} products
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subcategories</h4>
                    <div className="flex flex-wrap gap-2">
                      {subcategories[category]?.length > 0 ? (
                        subcategories[category].map(subcategory => (
                          <div key={`${category}-${subcategory}`} className="flex items-center">
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300 rounded-full text-xs flex items-center">
                              {subcategory}
                              <button 
                                onClick={() => deleteSubcategory(category, subcategory)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">No subcategories</span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 flex justify-end space-x-2">
                    <Link
                      to={`/admin/categories/${encodeURIComponent(category)}`}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="View Products"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedCategoryForSub(category);
                        setShowAddSubcategoryModal(true);
                      }}
                      className="text-green-600 hover:text-green-700 p-1"
                      title="Add Subcategory"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center justify-center">
                  <Tag className="h-12 w-12 text-gray-400 mb-2" />
                  <p>No categories found matching your criteria</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
                  {Math.min(indexOfLastItem, filteredCategories.length)}
                </span>{' '}
                of <span className="font-medium">{filteredCategories.length}</span> results
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

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Category</h3>
              <button 
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategory('');
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
              />
              {categoryList.includes(newCategory) && (
                <p className="mt-1 text-sm text-red-600">Category already exists</p>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategory('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategory || categoryList.includes(newCategory)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showAddSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Subcategory</h3>
              <button 
                onClick={() => {
                  setShowAddSubcategoryModal(false);
                  setNewSubcategory('');
                  setSelectedCategoryForSub('');
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parent Category
                </label>
                <select
                  value={selectedCategoryForSub}
                  onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a category</option>
                  {categoryList.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subcategory Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  placeholder="Enter subcategory name"
                  disabled={!selectedCategoryForSub}
                />
                {selectedCategoryForSub && subcategories[selectedCategoryForSub]?.includes(newSubcategory) && (
                  <p className="mt-1 text-sm text-red-600">Subcategory already exists in this category</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddSubcategoryModal(false);
                  setNewSubcategory('');
                  setSelectedCategoryForSub('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubcategory}
                disabled={!selectedCategoryForSub || !newSubcategory || subcategories[selectedCategoryForSub]?.includes(newSubcategory)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Subcategory
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
                Are you sure you want to delete the category "{categoryToDelete}"? This will also remove all its subcategories.
              </p>
              {productCounts[categoryToDelete] > 0 && (
                <p className="mt-2 text-sm text-red-600">
                  Warning: {productCounts[categoryToDelete]} products are associated with this category.
                </p>
              )}
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

export default CategoryManagement;