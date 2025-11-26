import { useState, useEffect } from 'react';
import { Bell, Activity, Mail, Shield, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { apiService } from '../../src/services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface ActivityLog {
  id: number;
  admin: string;
  action: string;
  timestamp: string;
  ip: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
    loadActivityLog();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getNotifications();
      
      if (response.success && response.data) {
        const notifs = Array.isArray(response.data) ? response.data : response.data.notifications || [];
        setNotifications(notifs.map((n: any) => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title || 'Notification',
          message: n.message || '',
          time: n.created_at ? formatTimeAgo(n.created_at) : 'N/A',
          read: n.read || false,
        })));
      } else {
        setError(response.message || 'Failed to load notifications');
      }
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityLog = async () => {
    try {
      const response = await apiService.getActivityLog();
      
      if (response.success && response.data) {
        const logs = Array.isArray(response.data) ? response.data : response.data.logs || [];
        setActivityLog(logs.map((log: any) => ({
          id: log.id,
          admin: log.admin_name || log.admin || 'Unknown',
          action: log.action || '',
          timestamp: log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A',
          ip: log.ip_address || log.ip || 'N/A',
        })));
      }
    } catch (err) {
      console.error('Error loading activity log:', err);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      if (minutes > 0) return `${minutes} min ago`;
      return 'Just now';
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 dark:text-white mb-1">Notifications & Logs</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Stay updated with platform activities</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            <Badge variant="destructive">{notifications.filter(n => !n.read).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Shield className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>Recent platform alerts and updates</CardDescription>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="text-sm text-blue-600 hover:underline"
                    onClick={loadNotifications}
                  >
                    <RefreshCw className={`h-4 w-4 inline ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button className="text-sm text-blue-600 hover:underline">
                    Mark all as read
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading notifications...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <button 
                    className="text-sm text-blue-600 hover:underline"
                    onClick={loadNotifications}
                  >
                    Try Again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      notification.read
                        ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'
                        : 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        notification.type === 'product' ? 'bg-purple-100 dark:bg-purple-950' :
                        notification.type === 'user' ? 'bg-orange-100 dark:bg-orange-950' :
                        notification.type === 'bid' ? 'bg-green-100 dark:bg-green-950' :
                        notification.type === 'payment' ? 'bg-blue-100 dark:bg-blue-950' :
                        'bg-gray-100 dark:bg-gray-900'
                      }`}>
                        {notification.type === 'product' ? <Bell className="h-5 w-5 text-purple-600" /> :
                         notification.type === 'user' ? <Shield className="h-5 w-5 text-orange-600" /> :
                         notification.type === 'bid' ? <Activity className="h-5 w-5 text-green-600" /> :
                         notification.type === 'payment' ? <CheckCircle className="h-5 w-5 text-blue-600" /> :
                         <Mail className="h-5 w-5 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-gray-900 dark:text-white">{notification.title}</p>
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Log</CardTitle>
              <CardDescription>Complete audit trail of admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No activity log entries</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.admin}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.action}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {log.ip}
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Customize your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Product Approvals</Label>
                    <p className="text-sm text-gray-500">Alert when new products need approval</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>User Reports</Label>
                    <p className="text-sm text-gray-500">Alert when users are reported</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>High-Value Bids</Label>
                    <p className="text-sm text-gray-500">Alert for bids over $1,000</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>System Updates</Label>
                    <p className="text-sm text-gray-500">Important platform announcements</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-gray-500">Login attempts and security events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
