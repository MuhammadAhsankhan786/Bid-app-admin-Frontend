import React, { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, Package, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { apiService } from '../services/api';
import { InlineLoader } from '../components/Loader';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function SellerEarningsDetailPage({ userRole, sellerId, onBack }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sellerId) {
      loadSellerEarnings();
    }
  }, [sellerId]);

  const loadSellerEarnings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSellerEarnings(sellerId);
      
      if (response.success) {
        setEarnings(response.data);
      } else {
        toast.error('Failed to load seller earnings');
      }
    } catch (error) {
      console.error('Error loading seller earnings:', error);
      toast.error('Failed to load seller earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <InlineLoader />;
  }

  if (!earnings) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">No earnings data found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Seller Earnings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {earnings.seller?.name || 'Seller'} - Earnings Dashboard
          </p>
        </div>
      </div>

      {/* Seller Info */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
              <p className="font-medium">{earnings.seller?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium">{earnings.seller?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
              <p className="font-medium">{earnings.seller?.phone || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earnings.total_earnings)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Earnings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earnings.pending_earnings)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {earnings.statistics?.total_sales || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg per Sale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(earnings.statistics?.average_per_sale || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
          <CardDescription>
            {earnings.breakdown?.length || 0} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.breakdown && earnings.breakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.breakdown.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={item.image_url}
                            alt={item.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-gray-500">ID: {item.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'sold' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(item.sold_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No earnings breakdown available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Earnings */}
      {earnings.monthly_earnings && earnings.monthly_earnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Sales Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.monthly_earnings.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(month.month).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(month.earnings)}
                      </TableCell>
                      <TableCell>{month.sales_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


