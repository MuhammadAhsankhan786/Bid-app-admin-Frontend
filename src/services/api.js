import axios from 'axios';

// Use local API for development, production API for deployment
// Set VITE_BASE_URL=http://localhost:5000/api in .env for local development
const BASE_URL = import.meta.env.VITE_BASE_URL || import.meta.env.REACT_APP_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Dashboard
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  async getDashboardCharts(period = 'week') {
    const response = await api.get('/admin/dashboard/charts', { params: { period } });
    return response.data;
  },

  async getDashboardCategories() {
    const response = await api.get('/admin/dashboard/categories');
    return response.data;
  },

  // Users
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async createUser(userData) {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  async updateUser(id, userData) {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  async updateUserRole(id, role) {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  async approveUser(id) {
    const response = await api.patch(`/admin/users/approve/${id}`);
    return response.data;
  },

  async blockUser(id) {
    const response = await api.patch(`/admin/users/block/${id}`);
    return response.data;
  },

  // Products
  async getProducts(params = {}) {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },

  async getPendingProducts() {
    const response = await api.get('/admin/products/pending');
    return response.data;
  },

  async getLiveAuctions() {
    const response = await api.get('/admin/products/live');
    return response.data;
  },

  async getProductById(id) {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },

  async getProductDocuments(id) {
    const response = await api.get(`/admin/products/${id}/documents`);
    return response.data;
  },

  async approveProduct(id, data = {}) {
    const response = await api.patch(`/admin/products/approve/${id}`, data);
    return response.data;
  },

  async rejectProduct(id, data = {}) {
    const response = await api.patch(`/admin/products/reject/${id}`, data);
    return response.data;
  },

  // Orders
  async getOrders(params = {}) {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  async getOrderStats() {
    const response = await api.get('/admin/orders/stats');
    return response.data;
  },

  async updateOrderStatus(id, data) {
    const response = await api.patch(`/admin/orders/${id}/status`, data);
    return response.data;
  },

  // Analytics
  async getWeeklyAnalytics() {
    const response = await api.get('/admin/analytics/weekly');
    return response.data;
  },

  async getMonthlyAnalytics() {
    const response = await api.get('/admin/analytics/monthly');
    return response.data;
  },

  async getCategoryAnalytics() {
    const response = await api.get('/admin/analytics/categories');
    return response.data;
  },

  async getTopProducts() {
    const response = await api.get('/admin/analytics/top-products');
    return response.data;
  },

  // Auctions
  async getActiveAuctions() {
    const response = await api.get('/admin/auctions/active');
    return response.data;
  },

  async getAuctionBids(id) {
    const response = await api.get(`/admin/auctions/${id}/bids`);
    return response.data;
  },

  // Notifications
  async getNotifications(params = {}) {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },

  // Payments
  async getPayments(params = {}) {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },
};

export default api;

