import React, { useState, useEffect } from 'react';
import { Bell, Activity, Mail, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { apiService as api } from '../services/api';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'read', 'unread'
  const [settings, setSettings] = useState({
    email_notifications: true,
    product_approvals: true,
    user_reports: true,
    high_value_bids: true,
    system_updates: true,
    security_alerts: true
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  useEffect(() => {
    loadNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {};
      if (filter === 'read') {
        params.read = 'true';
      } else if (filter === 'unread') {
        params.read = 'false';
      }

      const response = await api.getNotifications(params);

      // Transform backend data to match frontend format
      const transformedNotifications = (response.data || []).map(notif => ({
        id: notif.id,
        type: notif.type || 'system',
        title: notif.title || 'Notification',
        message: notif.message || notif.body || '',
        time: formatTimeAgo(new Date(notif.created_at || notif.createdAt)),
        read: notif.is_read || notif.isRead || false,
        user_name: notif.user_name,
        user_email: notif.user_email,
      }));

      setNotifications(transformedNotifications);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await api.getNotificationSettings();
      if (response && response.data) {
        setSettings(response.data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      // Optimistic update
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await api.updateNotificationSettings({ [key]: value });
    } catch (err) {
      console.error('Error updating settings:', err);
      // Revert on error
      setSettings(settings);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'product':
        return Bell;
      case 'user':
        return Shield;
      case 'bid':
        return Activity;
      case 'payment':
      case 'order':
        return CheckCircle;
      default:
        return Mail;
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'product':
        return 'text-purple-600';
      case 'user':
        return 'text-orange-600';
      case 'bid':
        return 'text-green-600';
      case 'payment':
      case 'order':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'product':
        return 'bg-purple-100 dark:bg-purple-950';
      case 'user':
        return 'bg-orange-100 dark:bg-orange-950';
      case 'bid':
        return 'bg-green-100 dark:bg-green-950';
      case 'payment':
      case 'order':
        return 'bg-blue-100 dark:bg-blue-950';
      default:
        return 'bg-gray-100 dark:bg-gray-900';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'read') return notif.read;
    if (filter === 'unread') return !notif.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gray-900 dark:text-white mb-1">Notifications & Logs</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Stay updated with platform activities</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
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

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>Recent platform alerts and updates</CardDescription>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading notifications...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={loadNotifications}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {filter === 'unread'
                      ? 'No unread notifications'
                      : filter === 'read'
                        ? 'No read notifications'
                        : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(notification => {
                    const Icon = getNotificationIcon(notification.type);
                    const iconColor = getNotificationColor(notification.type);
                    const bgColor = getNotificationBgColor(notification.type);

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-all hover:shadow-md ${notification.read
                          ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950'
                          : 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <p className="text-sm text-gray-900 dark:text-white font-medium">
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500">{notification.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            {notification.user_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                User: {notification.user_name} {notification.user_email && `(${notification.user_email})`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Log</CardTitle>
              <CardDescription>Complete audit trail of admin actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Activity log feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Customize your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSettings ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Product Approvals</Label>
                      <p className="text-sm text-gray-500">Alert when new products need approval</p>
                    </div>
                    <Switch
                      checked={settings.product_approvals}
                      onCheckedChange={(checked) => handleSettingChange('product_approvals', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>User Reports</Label>
                      <p className="text-sm text-gray-500">Alert when users are reported</p>
                    </div>
                    <Switch
                      checked={settings.user_reports}
                      onCheckedChange={(checked) => handleSettingChange('user_reports', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>High-Value Bids</Label>
                      <p className="text-sm text-gray-500">Alert for bids over $1,000</p>
                    </div>
                    <Switch
                      checked={settings.high_value_bids}
                      onCheckedChange={(checked) => handleSettingChange('high_value_bids', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>System Updates</Label>
                      <p className="text-sm text-gray-500">Important platform announcements</p>
                    </div>
                    <Switch
                      checked={settings.system_updates}
                      onCheckedChange={(checked) => handleSettingChange('system_updates', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-gray-500">Login attempts and security events</p>
                    </div>
                    <Switch
                      checked={settings.security_alerts}
                      onCheckedChange={(checked) => handleSettingChange('security_alerts', checked)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
