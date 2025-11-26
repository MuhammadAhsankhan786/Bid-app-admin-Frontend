import { useState, useEffect } from 'react';
import { Search, Download, Package, Truck, CheckCircle, Lock, RefreshCw, ShoppingCart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { UserRole } from './LoginPage';
import { apiService } from '../../src/services/api';

interface Order {
  id: string;
  buyer: string;
  seller: string;
  product: string;
  amount: string;
  paymentStatus: string;
  deliveryStatus: string;
  date: string;
}

export function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    inTransit: 0,
    completed: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');

  useEffect(() => {
    loadOrders();
    loadOrderStats();
  }, [searchQuery, paymentFilter, deliveryFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (paymentFilter !== 'all') params.paymentStatus = paymentFilter;
      if (deliveryFilter !== 'all') params.deliveryStatus = deliveryFilter;

      const response = await apiService.getOrders(params);
      
      if (response.success && response.data) {
        const ordersData = Array.isArray(response.data) ? response.data : response.data.orders || [];
        setOrders(ordersData.map((order: any) => ({
          id: order.id || order.order_id || `ORD-${order.id}`,
          buyer: order.buyer_name || order.buyer || 'Unknown',
          seller: order.seller_name || order.seller || 'Unknown',
          product: order.product_name || order.product || 'Unknown',
          amount: `$${order.total_amount || order.amount || 0}`,
          paymentStatus: order.payment_status || 'Pending',
          deliveryStatus: order.delivery_status || order.status || 'Pending',
          date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
        })));
      } else {
        setError(response.message || 'Failed to load orders');
      }
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrderStats = async () => {
    try {
      const response = await apiService.getOrderStats();
      if (response.success && response.data) {
        setStats({
          pending: response.data.pending || 0,
          inTransit: response.data.inTransit || response.data.in_transit || 0,
          completed: response.data.completed || 0,
        });
      }
    } catch (err) {
      // Ignore stats error, use defaults
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Orders & Transactions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track all platform transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Orders</p>
                <p className="text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Transit</p>
                <p className="text-gray-900 dark:text-white">{stats.inTransit}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Delivered</p>
                <p className="text-gray-900 dark:text-white">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by order ID, buyer, or seller..." className="pl-10" />
            </div>
            <Select defaultValue="all-payment">
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-payment">All Payments</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all-delivery">
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Delivery Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-delivery">All Deliveries</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `Total: ${orders.length} orders`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading orders...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={loadOrders}>
                Try Again
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell className="text-blue-600">{order.id}</TableCell>
                    <TableCell className="text-sm">{order.buyer}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {order.seller}
                    </TableCell>
                    <TableCell className="text-sm">{order.product}</TableCell>
                    <TableCell className="text-sm">{order.amount}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.paymentStatus === 'Completed' ? 'default' : 'secondary'}
                        className={order.paymentStatus === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : ''}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          order.deliveryStatus === 'Delivered' ? 'default' :
                          order.deliveryStatus === 'Shipped' ? 'secondary' :
                          'outline'
                        }
                        className={
                          order.deliveryStatus === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                          order.deliveryStatus === 'Shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                          ''
                        }
                      >
                        {order.deliveryStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {order.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
