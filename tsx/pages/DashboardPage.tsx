import { useState, useEffect } from 'react';
import { Users, Package, DollarSign, Activity, CheckCircle, AlertTriangle, UserX, TrendingUp, RefreshCw } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiService } from '../../src/services/api';

interface DashboardStats {
  totalUsers: string;
  activeAuctions: string;
  completedBids: string;
  totalRevenue: string;
  usersChange?: string;
  auctionsChange?: string;
  bidsChange?: string;
  revenueChange?: string;
}

interface ChartData {
  name: string;
  revenue: number;
  bids: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface RecentAction {
  id: number;
  type: string;
  user: string;
  action: string;
  time: string;
  status: string;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: '0',
    activeAuctions: '0',
    completedBids: '0',
    totalRevenue: '$0',
  });
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [reportedCount, setReportedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load dashboard stats
      const dashboardResponse = await apiService.getDashboard();
      if (dashboardResponse.success && dashboardResponse.data) {
        const data = dashboardResponse.data;
        setStats({
          totalUsers: data.totalUsers?.toLocaleString() || '0',
          activeAuctions: data.activeAuctions?.toLocaleString() || '0',
          completedBids: data.completedBids?.toLocaleString() || '0',
          totalRevenue: `$${data.totalRevenue?.toLocaleString() || '0'}`,
          usersChange: data.usersChange,
          auctionsChange: data.auctionsChange,
          bidsChange: data.bidsChange,
          revenueChange: data.revenueChange,
        });
      }

      // Load chart data
      const chartsResponse = await apiService.getDashboardCharts('week');
      if (chartsResponse.success && chartsResponse.data) {
        setRevenueData(chartsResponse.data.revenueData || []);
      }

      // Load category data
      const categoriesResponse = await apiService.getDashboardCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
        setCategoryData((categoriesResponse.data.categories || []).map((cat: any, index: number) => ({
          name: cat.name,
          value: cat.count || 0,
          color: colors[index % colors.length],
        })));
      }

      // Load pending products count
      try {
        const pendingResponse = await apiService.getPendingProducts();
        if (pendingResponse.success && pendingResponse.data) {
          setPendingCount(Array.isArray(pendingResponse.data) ? pendingResponse.data.length : 0);
        }
      } catch (e) {
        // Ignore if endpoint doesn't exist
      }

      // Recent actions - can be loaded from notifications or activity log
      // For now, set empty array - will be populated when backend provides this endpoint
      setRecentActions([]);

    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Dashboard Overview</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, Super Admin</p>
        </div>
        <Button variant="outline" onClick={loadDashboardData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.usersChange || 'Loading...'}
          changeType={stats.usersChange?.includes('+') ? 'positive' : stats.usersChange?.includes('-') ? 'negative' : 'neutral'}
          icon={Users}
          iconColor="bg-blue-500"
        />
        <StatsCard
          title="Active Auctions"
          value={stats.activeAuctions}
          change={stats.auctionsChange || 'Loading...'}
          changeType={stats.auctionsChange?.includes('+') ? 'positive' : stats.auctionsChange?.includes('-') ? 'negative' : 'neutral'}
          icon={Package}
          iconColor="bg-purple-500"
        />
        <StatsCard
          title="Completed Bids"
          value={stats.completedBids}
          change={stats.bidsChange || 'Loading...'}
          changeType={stats.bidsChange?.includes('+') ? 'positive' : stats.bidsChange?.includes('-') ? 'negative' : 'neutral'}
          icon={Activity}
          iconColor="bg-green-500"
        />
        <StatsCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={stats.revenueChange || 'Loading...'}
          changeType={stats.revenueChange?.includes('+') ? 'positive' : stats.revenueChange?.includes('-') ? 'negative' : 'neutral'}
          icon={DollarSign}
          iconColor="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Bids Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Bidding Trends</CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">No chart data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-800" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="bids" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Product distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500">No category data available</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</span>
                      </div>
                      <span className="text-sm">{cat.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your platform efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm">Approve Products</p>
                <p className="text-xs text-gray-500">{pendingCount} pending approvals</p>
              </div>
              <Badge>{pendingCount}</Badge>
            </Button>

            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm">View Flagged Auctions</p>
                <p className="text-xs text-gray-500">{flaggedCount} items need review</p>
              </div>
              <Badge variant="destructive">{flaggedCount}</Badge>
            </Button>

            <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm">Suspend Users</p>
                <p className="text-xs text-gray-500">{reportedCount} reported accounts</p>
              </div>
              <Badge variant="secondary">{reportedCount}</Badge>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 pb-4 border-b last:border-0 border-gray-200 dark:border-gray-800">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      action.status === 'success' ? 'bg-green-500' :
                      action.status === 'warning' ? 'bg-orange-500' :
                      action.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{action.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{action.user} • {action.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
