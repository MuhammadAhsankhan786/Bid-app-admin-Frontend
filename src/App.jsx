import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { AppSidebar } from './components/AppSidebar';
import { TopNavbar } from './components/TopNavbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ProductManagementPage } from './pages/ProductManagementPage';
import { OrderManagementPage } from './pages/OrderManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReferralTransactionsPage } from './pages/ReferralTransactionsPage';
import { ReferralSettingsPage } from './pages/ReferralSettingsPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';
import { WalletLogsPage } from './pages/WalletLogsPage';
import { SellerEarningsDetailPage } from './pages/SellerEarningsDetailPage';
import { AuctionWinnerDetailPage } from './pages/AuctionWinnerDetailPage';
import { Toaster } from './components/ui/sonner';
import { getRoleFromToken, getScopeFromToken } from './utils/roleUtils';
import { hasPageAccess } from './utils/roleAccess';
import React from 'react';

export default function App() {
  // Extract role from token on mount and validate scope
  // This runs first to validate scope before setting isAuthenticated
  const [userRole, setUserRole] = useState(() => {
    const token = localStorage.getItem('token');
    
    // Validate token scope - Admin Panel only accepts scope="admin" or no scope (backward compatibility)
    if (token) {
      const scope = getScopeFromToken(token);
      
      // If scope is "mobile", clear storage and force re-login
      if (scope === 'mobile') {
        console.warn('⚠️ [Admin Panel] Mobile-scope token detected on mount. Clearing storage.');
        localStorage.removeItem('token');
        // Will trigger re-render and show login page
        return null;
      }
      
      // Only allow tokens with scope="admin" or no scope (backward compatibility)
      if (scope && scope !== 'admin') {
        console.warn('⚠️ [Admin Panel] Invalid token scope on mount:', scope);
        localStorage.removeItem('token');
        return null;
      }
    }
    
    const role = getRoleFromToken(token);
    // Map backend role names to frontend format
    if (role === 'superadmin') return 'super-admin';
    return role || 'super-admin';
  });
  
  // Set isAuthenticated based on token presence AFTER scope validation
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Re-check token after scope validation (token may have been cleared)
    return !!localStorage.getItem('token');
  });
  
  // Get current page from URL hash, default to 'dashboard'
  const getPageFromHash = () => {
    const hash = window.location.hash.replace('#', '');
    const validPages = [
      'dashboard', 
      'moderator-dashboard', 
      'viewer-dashboard',
      'users', 
      'products', 
      'orders', 
      'analytics', 
      'notifications', 
      'settings',
      'referrals',
      'referral-settings',
      'wallet-logs',
      'seller-earnings',
      'auction-winner'
    ];
    // Map role-specific dashboards to main dashboard
    if (hash === 'moderator-dashboard' || hash === 'viewer-dashboard') {
      return 'dashboard';
    }
    return validPages.includes(hash) ? hash : 'dashboard';
  };
  
  const [currentPage, setCurrentPage] = useState(() => getPageFromHash());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Sync URL hash with current page on mount and when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setCurrentPage(page);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    // Set initial hash if not present
    if (!window.location.hash) {
      window.location.hash = 'dashboard';
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const handleLogin = (role, token) => {
    // Extract role from token if provided, otherwise use passed role
    const extractedRole = token ? getRoleFromToken(token) : role;
    // Map backend role names to frontend format
    const mappedRole = extractedRole === 'superadmin' ? 'super-admin' : (extractedRole || role);
    setUserRole(mappedRole);
    setIsAuthenticated(true);
    
    // Redirect based on role (handled by LoginPage, but ensure hash is set)
    const hash = window.location.hash.replace('#', '');
    if (!hash || hash === 'login') {
      // If no hash set, default based on role
      if (extractedRole === 'superadmin') {
        window.location.hash = 'dashboard';
      } else if (extractedRole === 'moderator') {
        window.location.hash = 'moderator-dashboard';
      } else if (extractedRole === 'viewer') {
        window.location.hash = 'viewer-dashboard';
      } else {
        window.location.hash = 'dashboard';
      }
    }
  };
  
  // Update role when token changes and validate scope
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token scope
      const scope = getScopeFromToken(token);
      
      // If scope is "mobile", clear storage and force re-login
      if (scope === 'mobile') {
        console.warn('⚠️ [Admin Panel] Mobile-scope token detected. Clearing storage.');
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        window.location.href = '/';
        return;
      }
      
      // Only allow tokens with scope="admin" or no scope (backward compatibility)
      if (scope && scope !== 'admin') {
        console.warn('⚠️ [Admin Panel] Invalid token scope:', scope);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        window.location.href = '/';
        return;
      }
      
      const role = getRoleFromToken(token);
      if (role) {
        const mappedRole = role === 'superadmin' ? 'super-admin' : role;
        setUserRole(mappedRole);
      }
    }
  }, [isAuthenticated]);
  const handleNavigate = page => {
    if (page === 'login') {
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    } else {
      // Check if user has access to this page
      const normalizedRole = userRole === 'superadmin' ? 'super-admin' : userRole;
      if (!hasPageAccess(normalizedRole, page)) {
        // Redirect to dashboard if no access
        console.warn(`Access denied: ${normalizedRole} cannot access ${page}`);
        setCurrentPage('dashboard');
        window.location.hash = 'dashboard';
        return;
      }
      setCurrentPage(page);
      // Update URL hash
      window.location.hash = page;
    }
    setIsMobileSidebarOpen(false);
  };
  
  // Protect routes on page load
  useEffect(() => {
    if (isAuthenticated) {
      const normalizedRole = userRole === 'superadmin' ? 'super-admin' : userRole;
      const currentHash = window.location.hash.replace('#', '');
      
      // Map role-specific dashboards
      const actualPage = currentHash === 'moderator-dashboard' || currentHash === 'viewer-dashboard' 
        ? 'dashboard' 
        : currentHash;
      
      if (actualPage && !hasPageAccess(normalizedRole, actualPage)) {
        // Redirect to dashboard if no access
        console.warn(`Access denied: ${normalizedRole} cannot access ${actualPage}`);
        setCurrentPage('dashboard');
        window.location.hash = 'dashboard';
      }
    }
  }, [isAuthenticated, userRole]);
  if (!isAuthenticated) {
    return /*#__PURE__*/React.createElement(ThemeProvider, null, /*#__PURE__*/React.createElement(LoginPage, {
      onLogin: handleLogin
    }), /*#__PURE__*/React.createElement(Toaster, null));
  }
  return /*#__PURE__*/React.createElement(ThemeProvider, null, /*#__PURE__*/React.createElement("div", {
    className: "h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hidden md:block"
  }, /*#__PURE__*/React.createElement(AppSidebar, {
    currentPage: currentPage,
    onNavigate: handleNavigate,
    isCollapsed: isSidebarCollapsed,
    onToggleCollapse: () => setIsSidebarCollapsed(!isSidebarCollapsed),
    userRole: userRole
  })), isMobileSidebarOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 z-40 md:hidden",
    onClick: () => setIsMobileSidebarOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-y-0 left-0 z-50 md:hidden"
  }, /*#__PURE__*/React.createElement(AppSidebar, {
    currentPage: currentPage,
    onNavigate: handleNavigate,
    isCollapsed: false,
    onToggleCollapse: () => {},
    userRole: userRole
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col overflow-hidden"
  }, /*#__PURE__*/React.createElement(TopNavbar, {
    onNavigate: handleNavigate,
    onToggleMobileSidebar: () => setIsMobileSidebarOpen(!isMobileSidebarOpen),
    userRole: userRole
  }), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-y-auto p-4 md:p-6"
  }, (() => {
    const normalizedRole = userRole === 'superadmin' ? 'super-admin' : userRole;
    
    // Route protection - only render if user has access
    if (currentPage === 'dashboard' && hasPageAccess(normalizedRole, 'dashboard')) {
      return /*#__PURE__*/React.createElement(DashboardPage, { userRole: userRole });
    }
    if (currentPage === 'users' && hasPageAccess(normalizedRole, 'users')) {
      return /*#__PURE__*/React.createElement(UserManagementPage, { userRole: userRole });
    }
    if (currentPage === 'products' && hasPageAccess(normalizedRole, 'products')) {
      return /*#__PURE__*/React.createElement(ProductManagementPage, { userRole: userRole });
    }
    if (currentPage === 'orders' && hasPageAccess(normalizedRole, 'orders')) {
      return /*#__PURE__*/React.createElement(OrderManagementPage, { userRole: userRole });
    }
    if (currentPage === 'analytics' && hasPageAccess(normalizedRole, 'analytics')) {
      return /*#__PURE__*/React.createElement(AnalyticsPage, null);
    }
    if (currentPage === 'notifications' && hasPageAccess(normalizedRole, 'notifications')) {
      return /*#__PURE__*/React.createElement(NotificationsPage, null);
    }
    if (currentPage === 'settings' && hasPageAccess(normalizedRole, 'settings')) {
      return /*#__PURE__*/React.createElement(SettingsPage, { userRole: userRole });
    }
    if (currentPage === 'referrals' && hasPageAccess(normalizedRole, 'referrals')) {
      return /*#__PURE__*/React.createElement(ReferralTransactionsPage, { userRole: userRole });
    }
    if (currentPage === 'referral-settings' && hasPageAccess(normalizedRole, 'referral-settings')) {
      return /*#__PURE__*/React.createElement(ReferralSettingsPage, { userRole: userRole });
    }
    if (currentPage === 'categories' && hasPageAccess(normalizedRole, 'categories')) {
      return /*#__PURE__*/React.createElement(CategoryManagementPage);
    }
    if (currentPage === 'wallet-logs' && hasPageAccess(normalizedRole, 'wallet-logs')) {
      return /*#__PURE__*/React.createElement(WalletLogsPage, { userRole: userRole });
    }
    if (currentPage === 'seller-earnings') {
      const sellerId = new URLSearchParams(window.location.search).get('sellerId');
      return /*#__PURE__*/React.createElement(SellerEarningsDetailPage, {
        userRole: userRole,
        sellerId: sellerId,
        onBack: () => {
          window.location.hash = 'users';
        }
      });
    }
    if (currentPage === 'auction-winner') {
      const productId = new URLSearchParams(window.location.search).get('productId');
      return /*#__PURE__*/React.createElement(AuctionWinnerDetailPage, {
        userRole: userRole,
        productId: productId,
        onBack: () => {
          window.location.hash = 'products';
        }
      });
    }
    
    // Default to dashboard if no access or unknown page
    return /*#__PURE__*/React.createElement(DashboardPage, { userRole: userRole });
  })()))), /*#__PURE__*/React.createElement(Toaster, null));
}