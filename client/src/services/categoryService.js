import api from './api';

class CategoryService {
  async getCategories() {
    const response = await api.get('/categories');
    return response.data.categories;
  }

  async getCategory(slug) {
    const response = await api.get(`/categories/${slug}`);
    return response.data.category;
  }

  // Admin methods
  async createCategory(categoryData) {
    const response = await api.post('/categories', categoryData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.category;
  }

  async updateCategory(id, categoryData) {
    const response = await api.put(`/categories/${id}`, categoryData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.category;
  }

  async deleteCategory(id) {
    await api.delete(`/categories/${id}`);
  }
}

export default new CategoryService();