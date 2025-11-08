/**
 * Role-Based Access Control Utilities
 * Handles role extraction from JWT and permission checks
 */

/**
 * Decode JWT token to extract user role
 * @param {string} token - JWT token
 * @returns {string|null} - User role or null if invalid
 */
export const getRoleFromToken = (token) => {
  if (!token) return null;
  
  try {
    // JWT is base64url encoded, split by dots
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Extract role and normalize (map legacy 'admin' to 'superadmin')
    let role = payload.role?.toLowerCase();
    if (role === 'admin') {
      role = 'superadmin';
    }
    
    return role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if user has required role(s)
 * @param {string} userRole - Current user role
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {boolean} - True if user has required role
 */
export const hasRole = (userRole, ...allowedRoles) => {
  if (!userRole) return false;
  
  const normalizedUserRole = userRole.toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
  
  // Map legacy roles
  const roleToCheck = normalizedUserRole === 'admin' || normalizedUserRole === 'super-admin' 
    ? 'superadmin' 
    : normalizedUserRole;
  
  return normalizedAllowedRoles.includes(roleToCheck);
};

/**
 * Check if user can access a specific feature
 * @param {string} userRole - Current user role
 * @param {string} feature - Feature name
 * @returns {boolean} - True if user can access feature
 */
export const canAccess = (userRole, feature) => {
  const permissions = {
    // User Management
    'users.view': hasRole(userRole, 'superadmin', 'moderator'),
    'users.create': hasRole(userRole, 'superadmin'),
    'users.update': hasRole(userRole, 'superadmin', 'moderator'),
    'users.delete': hasRole(userRole, 'superadmin'),
    'users.role': hasRole(userRole, 'superadmin'),
    
    // Products
    'products.view': hasRole(userRole, 'superadmin', 'moderator', 'viewer'),
    'products.pending': hasRole(userRole, 'superadmin', 'moderator'),
    'products.approve': hasRole(userRole, 'superadmin'),
    'products.reject': hasRole(userRole, 'superadmin'),
    
    // Auctions
    'auctions.view': hasRole(userRole, 'superadmin', 'moderator', 'viewer'),
    'auctions.bids': hasRole(userRole, 'superadmin', 'moderator', 'viewer'),
    
    // Dashboard
    'dashboard.view': hasRole(userRole, 'superadmin', 'viewer'),
    
    // Orders
    'orders.view': hasRole(userRole, 'superadmin', 'moderator'),
    'orders.update': hasRole(userRole, 'superadmin', 'moderator'),
    
    // Analytics
    'analytics.view': hasRole(userRole, 'superadmin', 'viewer'),
    
    // Notifications
    'notifications.view': hasRole(userRole, 'superadmin', 'moderator', 'viewer'),
    
    // Payments
    'payments.view': hasRole(userRole, 'superadmin', 'moderator'),
    
    // Settings
    'settings.view': hasRole(userRole, 'superadmin'),
  };
  
  return permissions[feature] || false;
};

/**
 * Get role display name
 * @param {string} role - Role code
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const roleMap = {
    'superadmin': 'Super Admin',
    'super-admin': 'Super Admin',
    'admin': 'Super Admin',
    'moderator': 'Moderator',
    'viewer': 'Viewer',
  };
  
  return roleMap[role?.toLowerCase()] || role || 'Unknown';
};

