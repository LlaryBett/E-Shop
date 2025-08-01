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
    const response = await api.get(`/products?category=${categoryId}&exclude=${productId}&limit=4`);
    return response.data.products;
  }

  async searchProducts(query) {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data.products;
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
}

export default new ProductService();