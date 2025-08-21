import api from './api';

const OrderService = {
async createOrder(orderData) {
  try {
    const response = await api.post('/orders', orderData);
    // Log the response for debugging
    console.log('API Response:', response);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    // Don't throw, instead return the error response
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create order'
    };
  }
},


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
  },

  async getOrder(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data.order;
  },

  async updateOrderStatus(id, status) {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data.order;
  },

  async cancelOrder(id) {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data.order;
  },

  async downloadInvoice(orderId) {
    // Returns a blob for the invoice PDF
    const response = await api.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async reorderOrder(orderId) {
    const response = await api.post(`/orders/${orderId}/reorder`);
    return response.data.items;
  },

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
  },
//  update order 
  async updateOrder(id, updateData) {
  try {
    const response = await api.put(`/orders/${id}`, updateData);
    return response.data.order; // assuming backend returns { order: {...} }
  } catch (error) {
    console.error('Update order error:', error);
    throw error;
  }
},


  // Proceed to checkout (place an order)
  async proceedToCheckout(checkoutPayload) {
    // The backend expects /api/checkout as the route
    const res = await api.post('/api/checkout', checkoutPayload);
    return res.data;
  },

  async checkPaymentStatus(pendingOrderId) {
    try {
      const response = await api.get(`/orders/payment-status/${pendingOrderId}`)
      console.log('Payment status response:', response);
      return response.data;
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  },
};

export default OrderService;