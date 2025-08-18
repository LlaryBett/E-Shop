import api from './api';

class CategoryService {
  async getCategories() {
    const response = await api.get('/categories');
    return response.data.data; // Fixed: Changed from .categories to .data
  }

  async getCategory(slug) {
    const response = await api.get(`/categories/${slug}`);
    return response.data.data; // Assuming single category is also in .data
  }

  async getMegaMenuCategories() {
    const response = await api.get('/categories?megaMenu=true');
    return response.data.data;
  }

  async getNavCategories() {
    const response = await api.get('/categories/nav'); // If you create this endpoint
    return response.data.data;
  }

  // Get products by subcategory item
  async getSubcategoryProducts(categorySlug, itemSlug, options = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    
    const response = await api.get(
      `/categories/${categorySlug}/subcategory/${itemSlug}/products`,
      {
        params: { page, limit, sort }
      }
    );
    return response.data;
  }

  // Admin methods
  async createCategory(categoryData) {
    const response = await api.post('/categories', categoryData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data; // Changed from .category to .data
  }

  async updateCategory(id, categoryData) {
    const response = await api.put(`/categories/${id}`, categoryData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data; // Changed from .category to .data
  }

  async deleteCategory(id) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }

  // Utility methods for filtering transformed data
  async getCategoriesWithSubcategories() {
    const categories = await this.getCategories();
    return categories.filter(category => category.subcategories.length > 0);
  }

  async getTopLevelCategories() {
    const categories = await this.getCategories();
    return categories.filter(category => !category.parent);
  }

  async getCategoriesByNavPosition() {
    const categories = await this.getCategories();
    return categories
      .filter(category => category.isNavItem)
      .sort((a, b) => a.navPosition - b.navPosition);
  }

  async getCategoriesForMegaMenu() {
    const categories = await this.getCategories();
    return categories
      .filter(category => category.menuConfig.displayInMegaMenu)
      .sort((a, b) => a.menuConfig.columnPosition - b.menuConfig.columnPosition);
  }
}

export default new CategoryService();