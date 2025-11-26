import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, XCircle, Flag, Eye, Timer, Lock, RefreshCw, Package } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { UserRole } from './LoginPage';
import { toast } from 'sonner@2.0.3';
import { apiService } from '../../src/services/api';

interface Product {
  id: number;
  name: string;
  seller?: string;
  category?: string;
  startingBid?: string;
  currentBid?: string;
  highestBidder?: string;
  totalBids?: number;
  timeLeft?: string;
  status?: string;
  image?: string;
  image_url?: string;
  submitted?: string;
  created_at?: string;
}

interface ProductManagementPageProps {
  userRole: UserRole;
}

export function ProductManagementPage({ userRole }: ProductManagementPageProps) {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [liveAuctions, setLiveAuctions] = useState<Product[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [errorPending, setErrorPending] = useState<string | null>(null);
  const [errorLive, setErrorLive] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const isReadOnly = userRole === 'viewer';

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingProducts();
    } else {
      loadLiveAuctions();
    }
  }, [activeTab]);

  const loadPendingProducts = async () => {
    try {
      setIsLoadingPending(true);
      setErrorPending(null);
      
      const response = await apiService.getPendingProducts();
      
      if (response.success && response.data) {
        const products = Array.isArray(response.data) ? response.data : [];
        setPendingProducts(products.map((p: any) => ({
          id: p.id,
          name: p.title || p.name,
          seller: p.seller_name || p.seller,
          category: p.category_name || p.category,
          startingBid: `$${p.starting_price || p.starting_bid || 0}`,
          image: p.image_url || p.image,
          image_url: p.image_url || p.image,
          submitted: p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A',
          created_at: p.created_at,
        })));
      } else {
        setErrorPending(response.message || 'Failed to load pending products');
      }
    } catch (err: any) {
      console.error('Error loading pending products:', err);
      setErrorPending(err.response?.data?.message || 'Failed to load pending products');
      toast.error('Failed to load pending products');
    } finally {
      setIsLoadingPending(false);
    }
  };

  const loadLiveAuctions = async () => {
    try {
      setIsLoadingLive(true);
      setErrorLive(null);
      
      const response = await apiService.getLiveAuctions();
      
      if (response.success && response.data) {
        const auctions = Array.isArray(response.data) ? response.data : [];
        setLiveAuctions(auctions.map((a: any) => ({
          id: a.id,
          name: a.title || a.name,
          currentBid: `$${a.current_bid || a.current_price || 0}`,
          highestBidder: a.highest_bidder || 'N/A',
          totalBids: a.total_bids || 0,
          timeLeft: a.time_left || a.end_date ? calculateTimeLeft(a.end_date) : 'N/A',
          status: a.status || 'active',
          image: a.image_url || a.image,
          image_url: a.image_url || a.image,
        })));
      } else {
        setErrorLive(response.message || 'Failed to load live auctions');
      }
    } catch (err: any) {
      console.error('Error loading live auctions:', err);
      setErrorLive(err.response?.data?.message || 'Failed to load live auctions');
      toast.error('Failed to load live auctions');
    } finally {
      setIsLoadingLive(false);
    }
  };

  const calculateTimeLeft = (endDate: string): string => {
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) return 'Ended';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Warning for Viewer */}
      {isReadOnly && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-start gap-3">
          <Lock className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm text-orange-900 dark:text-orange-100">Read-Only Mode</p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
              You are logged in as a Viewer. You can view data but cannot make changes.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-gray-900 dark:text-white mb-1">Products & Auctions</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage product approvals and live auctions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Approvals
            <Badge variant="secondary">{pendingProducts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Timer className="h-4 w-4" />
            Live Auctions
            <Badge variant="secondary">{liveAuctions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search products..." className="pl-10" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Products Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products Awaiting Approval</CardTitle>
                  <CardDescription>Review and approve new product listings</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadPendingProducts} disabled={isLoadingPending}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingPending ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPending ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading products...</span>
                </div>
              ) : errorPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <XCircle className="h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-600 dark:text-red-400 mb-4">{errorPending}</p>
                  <Button variant="outline" onClick={loadPendingProducts}>
                    Try Again
                  </Button>
                </div>
              ) : pendingProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No pending products</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Starting Bid</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                              {product.image_url || product.image ? (
                                <ImageWithFallback 
                                  src={product.image_url || product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm">{product.name}</span>
                          </div>
                        </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {product.seller}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {product.startingBid}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {product.submitted}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsProductModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            disabled={isReadOnly}
                            onClick={() => {
                              if (isReadOnly) {
                                toast.error('Access denied', { description: 'Only Super Admins and Moderators can approve products' });
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            disabled={isReadOnly}
                            onClick={() => {
                              if (isReadOnly) {
                                toast.error('Access denied', { description: 'Only Super Admins and Moderators can reject products' });
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-orange-600 hover:text-orange-700"
                            disabled={isReadOnly}
                          >
                            <Flag className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Auctions Tab */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveAuctions.map((auction) => (
              <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-900 dark:text-white mb-1">{auction.name}</h3>
                      <p className="text-sm text-gray-500">Current Bid: <span className="text-blue-600">{auction.currentBid}</span></p>
                    </div>
                    <Badge 
                      variant={
                        auction.status === 'hot' ? 'destructive' :
                        auction.status === 'ending' ? 'default' :
                        'secondary'
                      }
                    >
                      {auction.status === 'hot' ? '🔥 Hot' : auction.status === 'ending' ? '⏰ Ending Soon' : 'Active'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Highest Bidder</p>
                        <p className="text-sm">{auction.highestBidder}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total Bids</p>
                        <p className="text-sm">{auction.totalBids}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-400">Time Left</span>
                      </div>
                      <span className="text-sm text-blue-700 dark:text-blue-400">{auction.timeLeft}</span>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Details Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Review product information before approval</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                {selectedProduct.image_url || selectedProduct.image ? (
                  <ImageWithFallback 
                    src={selectedProduct.image_url || selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }
                    }}
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-400" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Product Name</p>
                  <p className="text-sm">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <Badge>{selectedProduct.category}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Seller</p>
                  <p className="text-sm">{selectedProduct.seller}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Starting Bid</p>
                  <p className="text-sm">{selectedProduct.startingBid}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This is a high-quality product in excellent condition. All items are verified and authentic.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="text-red-600" onClick={() => setIsProductModalOpen(false)}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button variant="outline" className="text-orange-600">
              <Flag className="h-4 w-4 mr-2" />
              Flag for Review
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsProductModalOpen(false)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
