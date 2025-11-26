import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Bell, 
  Settings,
  Lock,
  LogOut,
  ChevronLeft,
  Shield,
  UserPlus,
  Gift
} from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { UserRole } from '../pages/LoginPage';

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userRole: UserRole;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super-admin', 'moderator', 'viewer'] },
  { id: 'users', label: 'User Management', icon: Users, roles: ['super-admin', 'moderator'] },
  { id: 'products', label: 'Products & Auctions', icon: Package, roles: ['super-admin', 'moderator'] },
  { id: 'orders', label: 'Orders & Transactions', icon: ShoppingCart, roles: ['super-admin', 'moderator'] },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3, roles: ['super-admin', 'moderator', 'viewer'] },
  { id: 'notifications', label: 'Notifications & Logs', icon: Bell, roles: ['super-admin', 'moderator'] },
  { id: 'referrals', label: 'Referral Management', icon: UserPlus, roles: ['super-admin', 'moderator', 'viewer'], subItems: [
    { id: 'referrals', label: 'Referral Transactions', icon: Gift },
    { id: 'referral-settings', label: 'Referral Settings', icon: Settings }
  ] },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['super-admin'] },
];

export function AppSidebar({ currentPage, onNavigate, isCollapsed, onToggleCollapse, userRole }: AppSidebarProps) {
  const getRoleBadge = () => {
    switch (userRole) {
      case 'super-admin':
        return { label: 'Super Admin', color: 'bg-blue-600' };
      case 'moderator':
        return { label: 'Moderator', color: 'bg-purple-600' };
      case 'viewer':
        return { label: 'Viewer', color: 'bg-green-600' };
    }
  };

  const roleBadge = getRoleBadge();
  return (
    <div className={`h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white">BM</span>
            </div>
            <span className="text-gray-900 dark:text-white">BidMaster</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Role Badge */}
      {!isCollapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className={`${roleBadge.color} text-white px-3 py-2 rounded-lg flex items-center gap-2`}>
            <Shield className="h-4 w-4" />
            <span className="text-xs">{roleBadge.label}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.filter(item => item.roles.includes(userRole)).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.subItems && item.subItems.some(sub => currentPage === sub.id));
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    // Navigate to first sub-item if exists, otherwise to main item
                    if (item.subItems && item.subItems.length > 0) {
                      onNavigate(item.subItems[0].id);
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm flex-1 text-left">{item.label}</span>
                  )}
                </button>
                {/* Sub-items for referral management */}
                {!isCollapsed && item.subItems && isActive && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.filter(subItem => item.roles.includes(userRole)).map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = currentPage === subItem.id;
                      
                      return (
                        <button
                          key={subItem.id}
                          onClick={() => onNavigate(subItem.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
                            isSubActive 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                          }`}
                        >
                          <SubIcon className="h-4 w-4 flex-shrink-0" />
                          <span>{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {bottomItems.filter(item => item.roles.includes(userRole)).map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => onNavigate('login')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
}
