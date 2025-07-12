import api from './api';

class OrderService {
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data.order;
  }

  async getOrders(page = 1, limit = 10, status) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status && status !== 'all') {
      params.append('status', status);
    }

    const response = await api.get(`/orders?${params}`);
    return response.data;
  }

  async getOrder(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data.order;
  }

  async updateOrderStatus(id, status) {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data.order;
  }

  async cancelOrder(id) {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data.order;
  }

  // Admin methods
  async getAllOrders(page = 1, limit = 20, filters) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await api.get(`/admin/orders?${params}`);
    return response.data;
  }
}

export default new OrderService();