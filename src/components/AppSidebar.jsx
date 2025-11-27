import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Bell, Settings, LogOut, ChevronLeft, Shield, Tags } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { hasModuleAccess } from '../utils/roleAccess';
import React from 'react';

const navItems = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: LayoutDashboard,
  roles: ['super-admin', 'superadmin', 'moderator', 'viewer']
}, {
  id: 'users',
  label: 'User Management',
  icon: Users,
  roles: ['super-admin', 'superadmin', 'moderator']
}, {
  id: 'products',
  label: 'Products & Auctions',
  icon: Package,
  roles: ['super-admin', 'superadmin', 'moderator', 'viewer']
}, {
  id: 'orders',
  label: 'Orders & Transactions',
  icon: ShoppingCart,
  roles: ['super-admin', 'superadmin', 'moderator']
}, {
  id: 'analytics',
  label: 'Analytics & Reports',
  icon: BarChart3,
  roles: ['super-admin', 'superadmin', 'viewer']
}, {
  id: 'notifications',
  label: 'Notifications & Logs',
  icon: Bell,
  roles: ['super-admin', 'superadmin', 'moderator', 'viewer']
}, {
  id: 'categories',
  label: 'Categories',
  icon: Tags,
  roles: ['super-admin', 'superadmin', 'moderator']
}];
const bottomItems = [{
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  roles: ['super-admin', 'superadmin']
}];
export function AppSidebar({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  userRole
}) {
  const getRoleBadge = () => {
    // Normalize role (handle both 'super-admin' and 'superadmin')
    const normalizedRole = userRole === 'superadmin' ? 'super-admin' : userRole;
    
    switch (normalizedRole) {
      case 'super-admin':
        return {
          label: 'Super Admin',
          color: 'bg-blue-600'
        };
      case 'moderator':
        return {
          label: 'Moderator',
          color: 'bg-purple-600'
        };
      case 'viewer':
        return {
          label: 'Viewer',
          color: 'bg-green-600'
        };
      default:
        return {
          label: 'Admin',
          color: 'bg-gray-600'
        };
    }
  };
  
  // Filter nav items based on user role using roleAccess utility
  const normalizedUserRole = userRole === 'superadmin' ? 'super-admin' : userRole;
  
  // Map page IDs to module labels for access checking
  const pageToModule = {
    'dashboard': 'Dashboard',
    'users': 'Users',
    'products': 'Products',
    'orders': 'Orders',
    'analytics': 'Analytics',
    'notifications': 'Notifications',
    'categories': 'Categories',
    'settings': 'Settings'
  };
  
  const filteredNavItems = navItems.filter(item => {
    const moduleLabel = pageToModule[item.id];
    return moduleLabel && hasModuleAccess(normalizedUserRole, moduleLabel);
  });
  
  const filteredBottomItems = bottomItems.filter(item => {
    const moduleLabel = pageToModule[item.id];
    return moduleLabel && hasModuleAccess(normalizedUserRole, moduleLabel);
  });
  const roleBadge = getRoleBadge();
  return /*#__PURE__*/React.createElement("div", {
    className: `h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800"
  }, !isCollapsed && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-white"
  }, "BM")), /*#__PURE__*/React.createElement("span", {
    className: "text-gray-900 dark:text-white"
  }, "BidMaster")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "icon",
    onClick: onToggleCollapse,
    className: "h-8 w-8"
  }, /*#__PURE__*/React.createElement(ChevronLeft, {
    className: `h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`
  }))), !isCollapsed && /*#__PURE__*/React.createElement("div", {
    className: "px-3 pt-4 pb-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: `${roleBadge.color} text-white px-3 py-2 rounded-lg flex items-center gap-2`
  }, /*#__PURE__*/React.createElement(Shield, {
    className: "h-4 w-4"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs"
  }, roleBadge.label))), /*#__PURE__*/React.createElement(ScrollArea, {
    className: "flex-1 px-3 py-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, filteredNavItems.map(item => {
    const Icon = item.icon;
    const isActive = currentPage === item.id;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      onClick: () => onNavigate(item.id),
      className: `w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'}`
    }, /*#__PURE__*/React.createElement(Icon, {
      className: "h-5 w-5 flex-shrink-0"
    }), !isCollapsed && /*#__PURE__*/React.createElement("span", {
      className: "text-sm"
    }, item.label));
  })), /*#__PURE__*/React.createElement(Separator, {
    className: "my-4"
  }), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, filteredBottomItems.map(item => {
    const Icon = item.icon;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      onClick: () => onNavigate(item.id),
      className: "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
    }, /*#__PURE__*/React.createElement(Icon, {
      className: "h-5 w-5 flex-shrink-0"
    }), !isCollapsed && /*#__PURE__*/React.createElement("span", {
      className: "text-sm"
    }, item.label));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 border-t border-gray-200 dark:border-gray-800"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavigate('login'),
    className: "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
  }, /*#__PURE__*/React.createElement(LogOut, {
    className: "h-5 w-5 flex-shrink-0"
  }), !isCollapsed && /*#__PURE__*/React.createElement("span", {
    className: "text-sm"
  }, "Logout"))));
}