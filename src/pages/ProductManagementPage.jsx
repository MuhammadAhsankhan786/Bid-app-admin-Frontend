import { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, XCircle, Flag, Eye, Timer, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { apiService } from '../services/api';
import { InlineLoader } from '../components/Loader';

export function ProductManagementPage({ userRole }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [liveTotalPages, setLiveTotalPages] = useState(1);
  const isReadOnly = userRole === 'viewer';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [pendingResponse, liveResponse] = await Promise.all([
        apiService.getPendingProducts().catch(err => {
          console.error("Error fetching pending products:", err);
          return [];
        }),
        apiService.getLiveAuctions().catch(err => {
          console.error("Error fetching live auctions:", err);
          return [];
        })
      ]);
      
      // Backend returns arrays directly, not wrapped in objects
      const pending = Array.isArray(pendingResponse) ? pendingResponse : (pendingResponse?.products || []);
      const live = Array.isArray(liveResponse) ? liveResponse : (liveResponse?.auctions || []);
      
      console.log('Loaded products:', { 
        pendingCount: pending.length, 
        liveCount: live.length,
        pending: pending.slice(0, 2),
        live: live.slice(0, 2)
      });
      
      setPendingProducts(pending);
      setLiveAuctions(live);
      setPendingTotalPages(Math.ceil(pending.length / 10));
      setLiveTotalPages(Math.ceil(live.length / 8));
      
      if (pending.length === 0 && live.length === 0) {
        toast.info('No products found. Products will appear here once sellers add them.');
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products. Please check your connection.");
      setPendingProducts([]);
      setLiveAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    if (isReadOnly) {
      toast.error('Access denied', { description: 'Only Super Admins and Moderators can approve products' });
      return;
    }
    try {
      await apiService.approveProduct(productId);
      toast.success('Product approved successfully');
      loadProducts();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Error approving product:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve product';
      toast.error('Failed to approve product', { 
        description: errorMessage 
      });
    }
  };

  const handleReject = async (productId) => {
    if (isReadOnly) {
      toast.error('Access denied', { description: 'Only Super Admins and Moderators can reject products' });
      return;
    }
    try {
      await apiService.rejectProduct(productId, { reason: 'Rejected by admin' });
      toast.success('Product rejected');
      loadProducts();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Error rejecting product:", error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject product';
      toast.error('Failed to reject product', { 
        description: errorMessage 
      });
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

  const formatTimeLeft = (hoursLeft) => {
    if (!hoursLeft) return 'N/A';
    const hours = Math.floor(hoursLeft);
    const mins = Math.floor((hoursLeft - hours) * 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const filteredPending = pendingProducts.filter(p => 
    !searchTerm || 
    (p.title || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.seller_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsPerPage = 10;
  const pendingStartIndex = (pendingPage - 1) * itemsPerPage;
  const pendingEndIndex = pendingStartIndex + itemsPerPage;
  const paginatedPending = filteredPending.slice(pendingStartIndex, pendingEndIndex);

  const liveItemsPerPage = 8;
  const liveStartIndex = (livePage - 1) * liveItemsPerPage;
  const liveEndIndex = liveStartIndex + liveItemsPerPage;
  const paginatedLive = liveAuctions.slice(liveStartIndex, liveEndIndex);

  return (
    <div className="space-y-6">
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

      <div>
        <h1 className="text-gray-900 dark:text-white mb-1">Products & Auctions</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage product approvals and live auctions
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
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

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products Awaiting Approval</CardTitle>
              <CardDescription>Review and approve new product listings</CardDescription>
            </CardHeader>
            <CardContent>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <InlineLoader message="Loading products..." />
                      </TableCell>
                    </TableRow>
                  ) : paginatedPending.length > 0 ? (
                    paginatedPending.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                              <ImageWithFallback
                                src={product.image_url || product.image || `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&h=100&fit=crop`}
                                alt={product.title || product.name || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-sm">
                              {product.title || product.name || 'Untitled Product'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {product.seller_name || product.seller || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.category_name || product.category || 'Uncategorized'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          ${parseFloat(product.starting_bid || product.price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimeAgo(product.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const productData = await apiService.getProductById(product.id);
                                  setSelectedProduct(productData);
                                  setIsProductModalOpen(true);
                                } catch (error) {
                                  setSelectedProduct(product);
                                  setIsProductModalOpen(true);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              disabled={isReadOnly}
                              onClick={() => handleApprove(product.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              disabled={isReadOnly}
                              onClick={() => handleReject(product.id)}
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No pending products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <InlineLoader message="Loading auctions..." />
            </div>
          ) : paginatedLive.length > 0 ? (
            paginatedLive.map(auction => (
              <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-900 dark:text-white mb-1">
                        {auction.title || auction.name || 'Untitled Auction'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Current Bid:{' '}
                        <span className="text-blue-600">
                          ${parseFloat(auction.current_bid || auction.highest_bid || auction.starting_bid || 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <Badge
                      variant={auction.status === 'hot' ? 'destructive' : auction.status === 'ending' ? 'default' : 'secondary'}
                    >
                      {auction.status === 'hot' ? '🔥 Hot' : auction.status === 'ending' ? '⏰ Ending Soon' : 'Active'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Highest Bidder</p>
                        <p className="text-sm">{auction.highest_bidder_name || 'No bids yet'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total Bids</p>
                        <p className="text-sm">{auction.bid_count || 0}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-700 dark:text-blue-400">Time Left</span>
                      </div>
                      <span className="text-sm text-blue-700 dark:text-blue-400">
                        {formatTimeLeft(auction.hours_left)}
                      </span>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No live auctions found
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Review product information before approval</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={`https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop`}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
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
            <Button
              variant="outline"
              className="text-red-600"
              onClick={() => setIsProductModalOpen(false)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button variant="outline" className="text-orange-600">
              <Flag className="h-4 w-4 mr-2" />
              Flag for Review
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsProductModalOpen(false)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
