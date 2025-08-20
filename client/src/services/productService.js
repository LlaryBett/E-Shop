import api from './api';

class ProductService {
  async getProducts(
    page = 1,
    limit = 12,
    filters,
    sort,
    search
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (filters?.categories?.length) params.append('categories', filters.categories.join(','));
    if (filters?.brands?.length) params.append('brands', filters.brands.join(','));
    if (filters?.priceRange) {
      params.append('minPrice', filters.priceRange[0].toString());
      params.append('maxPrice', filters.priceRange[1].toString());
    }
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.inStock) params.append('inStock', 'true');
    if (filters?.onSale) params.append('onSale', 'true');
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/products?${params}`);
    return response.data;
  }

  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data.product;
  }

  async getFeaturedProducts() {
    const response = await api.get('/products?featured=true&limit=8');
    return response.data.products;
  }

  async getTrendingProducts() {
    const response = await api.get('/products?trending=true');
    return response.data.products;
  }

  async getRelatedProducts(productId, categoryId) {
    const response = await api.get(`/products?category=${categoryId}&exclude=${productId}&limit=12`);
    return response.data.products;
  }

  async searchProducts(query, page = 1, limit = 12, filters, sort) {
    const params = new URLSearchParams({
      q: encodeURIComponent(query),
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters to search if provided
    if (filters?.categories?.length) params.append('categories', filters.categories.join(','));
    if (filters?.brands?.length) params.append('brands', filters.brands.join(','));
    if (filters?.priceRange) {
      params.append('minPrice', filters.priceRange[0].toString());
      params.append('maxPrice', filters.priceRange[1].toString());
    }
    if (filters?.rating) params.append('rating', filters.rating.toString());
    if (filters?.inStock) params.append('inStock', 'true');
    if (filters?.onSale) params.append('onSale', 'true');
    if (sort) {
      params.append('sortBy', sort.field);
      params.append('sortOrder', sort.direction);
    }

    const response = await api.get(`/products/search?${params}`);
    return response.data;
  }

  // NEW: Search suggestions for autocomplete - Updated to match backend route
  async getSearchSuggestions(query, limit = 8) {
    try {
      const params = new URLSearchParams({
        q: encodeURIComponent(query),
        limit: limit.toString(),
      });

      // Updated to match your backend route: /api/products/search/suggestions
      const response = await api.get(`/products/search/suggestions?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      return { suggestions: [] };
    }
  }

  // Enhanced search with multiple result types
  async performSearch(query, page = 1, limit = 12, type = 'all') {
    try {
      const params = new URLSearchParams({
        q: encodeURIComponent(query),
        page: page.toString(),
        limit: limit.toString(),
      });

      if (type !== 'all') {
        params.append('type', type); // 'products', 'categories', 'brands'
      }

      // Updated to match your backend route
      const response = await api.get(`/products/search?${params}`);
      return {
        success: true,
        data: response.data,
        query,
        page,
        limit
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        error: error.message,
        data: {
          products: [],
          categories: [],
          brands: [],
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  // Get popular search terms
  async getPopularSearches(limit = 10) {
    try {
      const response = await api.get(`/products/search/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching popular searches:', error);
      return { searches: [] };
    }
  }

  // Track search queries (for analytics)
  async trackSearch(query, resultCount = 0) {
    try {
      await api.post('/products/search/track', {
        query: query.trim(),
        resultCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Fail silently for analytics tracking
      console.warn('Search tracking failed:', error);
    }
  }

  // Get search history for user (if logged in)
  async getSearchHistory(limit = 10) {
    try {
      const response = await api.get(`/products/search/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching search history:', error);
      return { searches: [] };
    }
  }

  // Clear search history
  async clearSearchHistory() {
    try {
      await api.delete('/products/search/history');
      return { success: true };
    } catch (error) {
      console.error('Error clearing search history:', error);
      return { success: false, error: error.message };
    }
  }

  // Admin methods
  async createProduct(productData) {
    const response = await api.post('/products', productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.product;
  }

  async updateProduct(id, productData) {
    const response = await api.put(`/products/${id}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.product;
  }

  async deleteProduct(id) {
    await api.delete(`/products/${id}`);
  }

  // Admin: Get search analytics - Updated to match backend route
  async getSearchAnalytics(startDate, endDate) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Updated to match your backend route
      const response = await api.get(`/products/search/analytics?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        topQueries: [],
        searchTrends: []
      };
    }
  }
}

export default new ProductService();