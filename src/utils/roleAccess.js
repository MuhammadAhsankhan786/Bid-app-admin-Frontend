/**
 * Role-Based Access Control Configuration
 * Defines which modules each role can access
 */

// Map module labels to page IDs
const MODULE_TO_PAGE = {
  'Dashboard': 'dashboard',
  'Users': 'users',
  'Products': 'products',
  'Auctions': 'products', // Auctions are part of products page
  'Orders': 'orders',
  'Payments': 'orders', // Payments are part of orders page
  'Documents': 'products', // Documents are part of products page
  'Notifications': 'notifications',
  'Analytics': 'analytics',
  'Settings': 'settings'
};

// Role-based access map
export const ROLE_ACCESS = {
  superadmin: [
    'Dashboard',
    'Users',
    'Products',
    'Auctions',
    'Payments',
    'Documents',
    'Notifications',
    'Analytics',
    'Settings'
  ],
  'super-admin': [ // Frontend format
    'Dashboard',
    'Users',
    'Products',
    'Auctions',
    'Payments',
    'Documents',
    'Notifications',
    'Analytics',
    'Settings'
  ],
  moderator: [
    'Dashboard',
    'Users',
    'Products',
    'Auctions',
    'Notifications'
  ],
  viewer: [
    'Dashboard',
    'Products',
    'Auctions'
  ]
};

/**
 * Check if user has access to a module
 * @param {string} userRole - User's role
 * @param {string} moduleLabel - Module label (e.g., 'Dashboard', 'Users')
 * @returns {boolean}
 */
export const hasModuleAccess = (userRole, moduleLabel) => {
  if (!userRole || !moduleLabel) return false;
  
  // Normalize role (handle both 'super-admin' and 'superadmin')
  const normalizedRole = userRole === 'super-admin' ? 'superadmin' : userRole.toLowerCase();
  
  const allowedModules = ROLE_ACCESS[normalizedRole] || [];
  return allowedModules.includes(moduleLabel);
};

/**
 * Check if user has access to a page
 * @param {string} userRole - User's role
 * @param {string} pageId - Page ID (e.g., 'dashboard', 'users')
 * @returns {boolean}
 */
export const hasPageAccess = (userRole, pageId) => {
  if (!userRole || !pageId) return false;
  
  // Normalize role
  const normalizedRole = userRole === 'super-admin' ? 'superadmin' : userRole.toLowerCase();
  
  const allowedModules = ROLE_ACCESS[normalizedRole] || [];
  
  // Check if any allowed module maps to this page
  return allowedModules.some(module => {
    const modulePage = MODULE_TO_PAGE[module];
    return modulePage === pageId;
  });
};

/**
 * Get all accessible pages for a role
 * @param {string} userRole - User's role
 * @returns {string[]} Array of page IDs
 */
export const getAccessiblePages = (userRole) => {
  if (!userRole) return [];
  
  // Normalize role
  const normalizedRole = userRole === 'super-admin' ? 'superadmin' : userRole.toLowerCase();
  
  const allowedModules = ROLE_ACCESS[normalizedRole] || [];
  const pages = new Set();
  
  allowedModules.forEach(module => {
    const page = MODULE_TO_PAGE[module];
    if (page) pages.add(page);
  });
  
  return Array.from(pages);
};

/**
 * Check if user can perform write operations (create, update, delete)
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const canWrite = (userRole) => {
  if (!userRole) return false;
  const normalizedRole = userRole === 'super-admin' ? 'superadmin' : userRole.toLowerCase();
  return normalizedRole === 'superadmin' || normalizedRole === 'moderator';
};

/**
 * Check if user can only view (read-only)
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isReadOnly = (userRole) => {
  if (!userRole) return false;
  const normalizedRole = userRole === 'super-admin' ? 'superadmin' : userRole.toLowerCase();
  return normalizedRole === 'viewer';
};

