import React, { useState, useEffect } from 'react';
import { Users, Package, DollarSign, Activity, CheckCircle, AlertTriangle, UserX } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { PageLoader } from '../components/Loader';
import { hasModuleAccess, canWrite, isReadOnly } from '../utils/roleAccess';

export function DashboardPage({ userRole }) {
  const normalizedRole = userRole === 'superadmin' ? 'super-admin' : userRole;
  const canViewAnalytics = hasModuleAccess(normalizedRole, 'Analytics');
  const canViewPayments = hasModuleAccess(normalizedRole, 'Payments');
  const canViewUsers = hasModuleAccess(normalizedRole, 'Users');
  const canViewPendingProducts = hasModuleAccess(normalizedRole, 'Products') && !isReadOnly(normalizedRole);
  const isReadOnlyUser = isReadOnly(normalizedRole);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: "0",
    activeAuctions: "0",
    completedBids: "0",
    revenue: "$0"
  });
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [pendingProducts, setPendingProducts] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Build array of promises conditionally based on role
      const promises = [
        apiService.getDashboard(),
        apiService.getDashboardCharts('week'),
        apiService.getDashboardCategories()
      ];

      // Only fetch pending products if user has access (not for viewers)
      if (canViewPendingProducts) {
        promises.push(apiService.getPendingProducts());
      }

      const results = await Promise.all(promises);
      const dashboard = results[0];
      const charts = results[1];
      const categories = results[2];
      const pending = canViewPendingProducts ? results[3] : [];

      setStats({
        users: dashboard.stats?.users || "0",
        activeAuctions: dashboard.stats?.activeAuctions || "0",
        completedBids: dashboard.stats?.orders || "0",
        revenue: `$${parseFloat(dashboard.stats?.revenue || 0).toLocaleString()}`
      });

      if (charts.revenue && charts.bids) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const revenueMap = {};
        charts.revenue.forEach((item, index) => {
          const dayName = days[index % 7] || days[new Date(item.date).getDay() - 1] || 'Mon';
          revenueMap[dayName] = {
            name: dayName,
            revenue: parseFloat(item.revenue) || 0,
            bids: parseInt(charts.bids[index]?.bids || 0) || 0
          };
        });
        setRevenueData(Object.values(revenueMap).length > 0 ? Object.values(revenueMap) : [
          { name: 'Mon', revenue: 0, bids: 0 },
          { name: 'Tue', revenue: 0, bids: 0 },
          { name: 'Wed', revenue: 0, bids: 0 },
          { name: 'Thu', revenue: 0, bids: 0 },
          { name: 'Fri', revenue: 0, bids: 0 },
          { name: 'Sat', revenue: 0, bids: 0 },
          { name: 'Sun', revenue: 0, bids: 0 }
        ]);
      }

      if (categories && categories.length > 0) {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
        // Use index to create unique keys and handle duplicate names
        setCategoryData(categories.map((cat, index) => ({
          id: `cat-${index}-${cat.name}`,
          name: cat.name,
          value: parseInt(cat.value) || 0,
          color: colors[index % colors.length]
        })));
      }

      if (dashboard.recentActions && dashboard.recentActions.length > 0) {
        setRecentActions(dashboard.recentActions.slice(0, 4).map((action, index) => ({
          id: index + 1,
          type: action.type || 'system',
          user: action.user || 'System',
          action: action.action,
          time: formatTimeAgo(action.time || new Date()),
          status: action.type === 'approval' ? 'success' : action.type === 'flag' ? 'warning' : action.type === 'user' ? 'error' : 'info'
        })));
      }

      setPendingProducts(pending.length || 0);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
      setRevenueData([
        { name: 'Mon', revenue: 0, bids: 0 },
        { name: 'Tue', revenue: 0, bids: 0 },
        { name: 'Wed', revenue: 0, bids: 0 },
        { name: 'Thu', revenue: 0, bids: 0 },
        { name: 'Fri', revenue: 0, bids: 0 },
        { name: 'Sat', revenue: 0, bids: 0 },
        { name: 'Sun', revenue: 0, bids: 0 }
      ]);
      setCategoryData([
        { id: 'cat-0-Electronics', name: 'Electronics', value: 0, color: '#3b82f6' },
        { id: 'cat-1-Fashion', name: 'Fashion', value: 0, color: '#8b5cf6' },
        { id: 'cat-2-Home', name: 'Home', value: 0, color: '#ec4899' },
        { id: 'cat-3-Sports', name: 'Sports', value: 0, color: '#10b981' }
      ]);
      setRecentActions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return React.createElement(PageLoader, { message: "Loading dashboard..." });
  }

  // Special Dashboard View for Employee
  if (normalizedRole === 'employee') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Employee Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your Company Products
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer" onClick={() => window.location.hash = 'products'}>
            <CardHeader className="pb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Manage Products</CardTitle>
              <CardDescription>View and edit company products</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between group">
                Go to Products
                <Package className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:border-purple-500 transition-colors cursor-pointer" onClick={() => window.location.hash = 'categories'}>
            <CardHeader className="pb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>View product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between group">
                View Categories
                <Activity className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Product Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <div>
                <h4 className="font-medium text-sm">Upload Products</h4>
                <p className="text-sm text-muted-foreground">Add high-quality images and detailed descriptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <div>
                <h4 className="font-medium text-sm">Manage Listings</h4>
                <p className="text-sm text-muted-foreground">Edit or remove company products as needed.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <div>
                <h4 className="font-medium text-sm">Monitor Approval</h4>
                <p className="text-sm text-muted-foreground">Ensure products meet quality standards for customers.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return React.createElement(
    "div",
    { className: "space-y-6" },

    React.createElement(
      "div",
      null,
      React.createElement("h1", { className: "text-gray-900 dark:text-white mb-1" }, "Dashboard Overview"),
      React.createElement("p", { className: "text-sm text-gray-600 dark:text-gray-400" },
        `Welcome back, ${normalizedRole === 'super-admin' || normalizedRole === 'superadmin' ? 'Super Admin' :
          normalizedRole === 'moderator' ? 'Moderator' :
            normalizedRole === 'viewer' ? 'Viewer' : 'Admin'}`
      )
    ),

    React.createElement(
      "div",
      { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" },
      canViewUsers && React.createElement(StatsCard, { title: "Total Users", value: stats.users, change: "+12.5% from last month", changeType: "positive", icon: Users, iconColor: "bg-blue-500" }),
      React.createElement(StatsCard, { title: "Active Auctions", value: stats.activeAuctions, change: "+8.2% from last week", changeType: "positive", icon: Package, iconColor: "bg-purple-500" }),
      React.createElement(StatsCard, { title: "Completed Bids", value: stats.completedBids, change: "+23.1% from last month", changeType: "positive", icon: Activity, iconColor: "bg-green-500" }),
      canViewPayments && React.createElement(StatsCard, { title: "Total Revenue", value: stats.revenue, change: "+15.3% from last month", changeType: "positive", icon: DollarSign, iconColor: "bg-orange-500" })
    ),

    React.createElement(
      "div",
      { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },

      canViewAnalytics && React.createElement(
        Card,
        { className: "lg:col-span-2" },
        React.createElement(CardHeader, null,
          React.createElement(CardTitle, null, "Revenue & Bidding Trends"),
          React.createElement(CardDescription, null, "Last 7 days performance")
        ),
        React.createElement(CardContent, null,
          React.createElement(
            ResponsiveContainer,
            { width: "100%", height: 300 },
            React.createElement(
              AreaChart,
              { data: revenueData },
              React.createElement(CartesianGrid, { strokeDasharray: "3 3", className: "stroke-gray-200 dark:stroke-gray-800" }),
              React.createElement(XAxis, { dataKey: "name", className: "text-xs" }),
              React.createElement(YAxis, { className: "text-xs" }),
              React.createElement(Tooltip, { contentStyle: { backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' } }),
              React.createElement(Area, { type: "monotone", dataKey: "revenue", stackId: "1", stroke: "#3b82f6", fill: "#3b82f6", fillOpacity: 0.6 }),
              React.createElement(Area, { type: "monotone", dataKey: "bids", stackId: "2", stroke: "#8b5cf6", fill: "#8b5cf6", fillOpacity: 0.6 })
            )
          )
        )
      ),

      canViewAnalytics && React.createElement(
        Card,
        null,
        React.createElement(CardHeader, null,
          React.createElement(CardTitle, null, "Top Categories"),
          React.createElement(CardDescription, null, "Product distribution")
        ),
        React.createElement(CardContent, null,
          React.createElement(
            ResponsiveContainer,
            { width: "100%", height: 300 },
            React.createElement(
              PieChart,
              null,
              React.createElement(
                Pie,
                { data: categoryData, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, paddingAngle: 5, dataKey: "value" },
                categoryData.map((entry, index) => React.createElement(Cell, { key: `cell-${index}`, fill: entry.color }))
              ),
              React.createElement(Tooltip, null)
            )
          ),
          React.createElement(
            "div",
            { className: "mt-4 space-y-2" },
            categoryData.map((cat, index) =>
              React.createElement(
                "div",
                { key: cat.id || `category-${index}`, className: "flex items-center justify-between" },
                React.createElement(
                  "div",
                  { className: "flex items-center gap-2" },
                  React.createElement("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: cat.color } }),
                  React.createElement("span", { className: "text-sm text-gray-600 dark:text-gray-400" }, cat.name)
                ),
                React.createElement("span", { className: "text-sm" }, cat.value)
              )
            )
          )
        )
      )
    )
  );
}
