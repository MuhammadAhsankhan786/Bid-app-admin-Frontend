import axios from 'axios';
import { getScopeFromToken } from '../utils/roleUtils';

/**
 * Get API Base URL based on environment
 * - Development: http://localhost:5000/api
 * - Production: https://api.mazaadati.com/api
 * - Can be overridden with VITE_BASE_URL environment variable or localStorage
 */
function getBaseUrl() {
  // Priority 1: Check if running on localhost (ALWAYS use local URL on localhost)
  // This takes priority over localStorage to ensure local testing works
  const hostname = window.location.hostname;
  const port = window.location.port;
  const isLocalhost = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.');

  // If on localhost, ALWAYS use local URL (ignore localStorage override)
  if (isLocalhost) {
    const localUrl = 'http://localhost:5000/api';
    console.log('🌐 [Admin Panel] Localhost detected - Using LOCAL API:', localUrl);
    console.log('   Hostname:', hostname, 'Port:', port);
    console.log('   Make sure backend is running on http://localhost:5000');
    console.log('   ⚠️  localStorage override ignored for localhost');
    return localUrl;
  }

  // Priority 2: Check localStorage for manual override (only for non-localhost)
  const storedUrl = localStorage.getItem('API_BASE_URL');
  if (storedUrl && storedUrl.trim() !== '') {
    console.log('🌐 [Admin Panel] Using API URL from localStorage:', storedUrl);
    return storedUrl;
  }

  // Priority 3: Check if it's a production domain (not localhost)
  // If hostname is not localhost and not a private IP, it's production
  const isProductionDomain = 
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    !hostname.startsWith('192.168.') &&
    !hostname.startsWith('10.') &&
    !hostname.startsWith('172.') &&
    hostname !== '' &&
    !hostname.includes('.local');

  // If on production domain, use production API directly
  if (isProductionDomain) {
    const productionUrl = 'https://api.mazaadati.com/api';
    console.log('🌐 [Admin Panel] Production domain detected - Using PRODUCTION API:', productionUrl);
    console.log('   Hostname:', hostname, 'Port:', port);
    return productionUrl;
  }

  // Priority 4: Check environment variable (only for non-production)
  const envUrl = import.meta.env.VITE_BASE_URL || import.meta.env.REACT_APP_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    console.log('🌐 [Admin Panel] Using API URL from environment:', envUrl);
    return envUrl;
  }

  // Priority 5: Check Vite development mode (only for localhost)
  const isViteDev = import.meta.env.MODE === 'development' ||
    import.meta.env.DEV ||
    import.meta.env.PROD === false;

  // Use local URL if in development mode (only on localhost)
  if (isViteDev || port === '3000' || port === '5173') {
    const localUrl = 'http://localhost:5000/api';
    console.log('🌐 [Admin Panel] Development mode - Using LOCAL API:', localUrl);
    console.log('   Hostname:', hostname, 'Port:', port);
    console.log('   Make sure backend is running on http://localhost:5000');
    return localUrl;
  }

  // Fallback: Production mode (when deployed to production domain)
  const productionUrl = 'https://api.mazaadati.com/api';
  console.log('🌐 [Admin Panel] Fallback - Using PRODUCTION API:', productionUrl);
  console.log('   Hostname:', hostname, 'Port:', port);
  return productionUrl;
}

const BASE_URL = getBaseUrl();

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests with scope validation
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Verify token scope is "admin" (or undefined for backward compatibility)
    const scope = getScopeFromToken(token);

    // If scope is "mobile", clear storage and force re-login
    if (scope === 'mobile') {
      console.warn('⚠️ [Admin Panel] Mobile-scope token detected. Clearing storage and forcing re-login.');
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '/';
      // Reject the request
      return Promise.reject(new Error('Mobile token detected. Admin panel requires admin-scope token.'));
    }

    // Only allow tokens with scope="admin" or no scope (backward compatibility)
    if (scope && scope !== 'admin') {
      console.warn('⚠️ [Admin Panel] Invalid token scope:', scope);
      localStorage.removeItem('token');
      window.location.href = '/';
      return Promise.reject(new Error('Invalid token scope for admin panel.'));
    }

    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track if we've already tried to switch to production (prevent infinite loop)
let hasSwitchedToProduction = false;

// Handle auth errors and connection failures with auto-fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Handle connection refused errors (backend not running) - AUTO-SWITCH to production
    if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' ||
      (error.message && error.message.includes('ERR_CONNECTION_REFUSED'))) &&
      !hasSwitchedToProduction) {
      const currentUrl = BASE_URL;

      // If trying to connect to localhost and it fails, AUTO-SWITCH to production
      if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
        console.warn('⚠️ [Admin Panel] Local backend not accessible:', currentUrl);
        console.warn('   🔄 Auto-switching to PRODUCTION API...');

        // Auto-switch to production
        localStorage.setItem('API_BASE_URL', 'https://api.mazaadati.com/api');
        hasSwitchedToProduction = true;

        console.log('✅ [Admin Panel] Switched to PRODUCTION API: https://api.mazaadati.com/api');
        console.log('   💡 To switch back to local, run:');
        console.log('      localStorage.setItem("API_BASE_URL", "http://localhost:5000/api"); location.reload();');

        // Reload page to use new URL
        window.location.reload();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  // Generic HTTP methods
  async get(url, config = {}) {
    const response = await api.get(url, config);
    return response;
  },

  async post(url, data = {}, config = {}) {
    const response = await api.post(url, data, config);
    return response;
  },

  async put(url, data = {}, config = {}) {
    const response = await api.put(url, data, config);
    return response;
  },

  async patch(url, data = {}, config = {}) {
    const response = await api.patch(url, data, config);
    return response;
  },

  async delete(url, config = {}) {
    const response = await api.delete(url, config);
    return response;
  },

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

  // Orders
  async getOrderStats() {
    const response = await api.get('/admin/orders/stats');
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

  async changeAdminPhone(id, phone, confirmPassword) {
    const response = await api.put(`/admin/users/${id}/change-admin-phone`, {
      phone,
      confirmPassword
    });
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
  async createProduct(productData) {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },

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

  async getRejectedProducts() {
    const response = await api.get('/admin/products/rejected');
    return response.data;
  },

  async getCompletedProducts(params = {}) {
    const response = await api.get('/admin/products/completed', { params });
    return response.data;
  },

  async getProductById(id) {
    console.log('[API] getProductById called with id:', id);
    const response = await api.get(`/admin/products/${id}`);
    console.log('[API] getProductById response:', response.data);
    // Backend returns { success: true, data: {...} }
    return response.data?.data || response.data;
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

  async updateProduct(id, data) {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id) {
    const response = await api.delete(`/admin/products/${id}`);
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

  async getCategories() {
    const response = await api.get('/categories');
    return response.data;
  },

  // Upload Images (Cloudinary) - Admin Panel
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/uploads/admin/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadImages(files) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const response = await api.post('/uploads/admin/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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

  async getNotificationSettings() {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  async updateNotificationSettings(settings) {
    const response = await api.put('/notifications/settings', settings);
    return response.data;
  },

  // Payments
  async getPayments(params = {}) {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  // Referrals
  async getReferrals(params = {}) {
    const response = await api.get('/admin/referrals', { params });
    return response.data;
  },

  async revokeReferral(id) {
    const response = await api.put(`/admin/referrals/${id}/revoke`);
    return response.data;
  },

  async adjustUserRewardBalance(userId, data) {
    const response = await api.put(`/admin/users/${userId}/adjust-reward`, data);
    return response.data;
  },

  async getReferralSettings() {
    const response = await api.get('/admin/referral/settings');
    return response.data;
  },

  async updateReferralSettings(data) {
    const response = await api.put('/admin/referral/settings', data);
    return response.data;
  },

  // Wallet Logs
  async getWalletLogs(params = {}) {
    const response = await api.get('/admin/wallet/logs', { params });
    return response.data;
  },

  // Seller Earnings (Admin View)
  async getSellerEarnings(sellerId) {
    const response = await api.get(`/admin/seller/${sellerId}/earnings`);
    return response.data;
  },

  // Auction Winner Details (Admin View)
  async getAuctionWinnerDetails(productId) {
    const response = await api.get(`/admin/auction/${productId}/winner`);
    return response.data;
  },

  // Banners
  async getBanners() {
    try {
      const response = await api.get('/banners');
      return response.data;
    } catch (error) {
      // If 404, return empty array (no banners created yet)
      if (error.response?.status === 404) {
        return { success: true, data: [] };
      }
      throw error;
    }
  },

  async createBanner(formData) {
    const response = await api.post('/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updateBanner(id, formData) {
    const response = await api.put(`/banners/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteBanner(id) {
    const response = await api.delete(`/banners/${id}`);
    return response.data;
  },
};

export default api;

