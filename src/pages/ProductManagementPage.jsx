// FULL UPDATED ProductManagementPage.jsx — FIXED MODAL OVERFLOW + FIXED JSX + CLEANED STRUCTURE
// 100% READY TO USE

import { useState, useEffect, Fragment } from 'react';
import { Search, Clock, CheckCircle, XCircle, Flag, Eye, Timer, Lock, Edit, Trash2, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { apiService } from '../services/api';
import { InlineLoader } from '../components/Loader';
import { hasModuleAccess, isReadOnly as checkReadOnly } from '../utils/roleAccess';

export function ProductManagementPage({ userRole }) {
  const normalizedRole = userRole === 'superadmin' ? 'super-admin' : userRole;
  const canViewPendingProducts = hasModuleAccess(normalizedRole, 'Products') && !checkReadOnly(normalizedRole);
  const isSuperAdmin = userRole === 'superadmin' || userRole === 'super-admin';
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [completedAuctions, setCompletedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [liveTotalPages, setLiveTotalPages] = useState(1);
  const [completedTotalPages, setCompletedTotalPages] = useState(1);
  const isReadOnly = userRole === 'viewer';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const promises = [
        canViewPendingProducts
          ? apiService.getPendingProducts().catch(() => [])
          : Promise.resolve([]),
        apiService.getLiveAuctions().catch(() => []),
        apiService.getProducts({ status: 'sold', limit: 100 }).catch(() => [])
      ];

      const [pendingResponse, liveResponse, completedResponse] = await Promise.all(promises);

      const pending = Array.isArray(pendingResponse) ? pendingResponse : pendingResponse?.products || [];
      const live = Array.isArray(liveResponse) ? liveResponse : liveResponse?.auctions || [];
      const completed = Array.isArray(completedResponse) ? completedResponse : completedResponse?.products || [];

      setPendingProducts(pending);
      setLiveAuctions(live);
      setCompletedAuctions(completed);
      setPendingTotalPages(Math.ceil(pending.length / 10));
      setLiveTotalPages(Math.ceil(live.length / 8));
      setCompletedTotalPages(Math.ceil(completed.length / 8));

      if (pending.length === 0 && live.length === 0 && completed.length === 0) {
        toast.info('No products found.');
      }
    } catch (error) {
      toast.error('Failed to load products');
      setPendingProducts([]);
      setLiveAuctions([]);
      setCompletedAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (isReadOnly) return toast.error('Viewer cannot approve');
    try {
      await apiService.approveProduct(id);
      toast.success('Product approved');
      setIsProductModalOpen(false);
      loadProducts();
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    if (isReadOnly) return toast.error('Viewer cannot reject');
    try {
      await apiService.rejectProduct(id, { reason: 'Rejected by admin' });
      toast.success('Product rejected');
      setIsProductModalOpen(false);
      loadProducts();
    } catch {
      toast.error('Failed to reject');
    }
  };

  const handleDelete = async (id, name) => {
    if (!isSuperAdmin) {
      toast.error('Access denied', { description: 'Only Super Admin can delete products' });
      return;
    }
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiService.deleteProduct(id);
      toast.success('Product deleted successfully');
      loadProducts();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("Error deleting product:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete product';
      toast.error('Failed to delete product', { 
        description: errorMessage 
      });
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    const mins = diff / 60000;
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${Math.floor(mins)} min ago`;
    const hours = mins / 60;
    if (hours < 24) return `${Math.floor(hours)} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const filteredPending = pendingProducts.filter((p) =>
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPending = filteredPending.slice((pendingPage - 1) * 10, pendingPage * 10);
  const paginatedLive = liveAuctions.slice((livePage - 1) * 8, livePage * 8);

  return (
    <div className="space-y-6 w-full">

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent
          className="max-w-[500px] w-full
                     max-h-[85vh]
                     p-6
                     flex flex-col overflow-hidden"
        >
          <DialogHeader className="flex-shrink-0 pb-3">
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Review product before approval</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden max-h-[40vh] min-h-[200px] flex items-center justify-center">
                <ImageWithFallback
                  src={selectedProduct.image_url || selectedProduct.image || ''}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
                    }
                  }}
                  alt={selectedProduct.title || selectedProduct.name || 'Product'}
                  className="w-full h-full max-h-[40vh] object-contain"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Product Name</p>
                  <p className="font-medium text-gray-900 dark:text-white break-words">{selectedProduct.title || selectedProduct.name || 'Untitled Product'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
                  <Badge>{selectedProduct.category_name || selectedProduct.category || 'Uncategorized'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Seller</p>
                  <p className="text-gray-900 dark:text-white break-words">{selectedProduct.seller_name || selectedProduct.seller || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Starting Bid</p>
                  <p className="font-medium text-gray-900 dark:text-white">${parseFloat(selectedProduct.starting_bid || selectedProduct.startingBid || selectedProduct.price || 0).toFixed(2)}</p>
                </div>
                {(selectedProduct.current_bid || selectedProduct.highest_bid) && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Bid</p>
                    <p className="font-medium text-blue-600 dark:text-blue-400">${parseFloat(selectedProduct.current_bid || selectedProduct.highest_bid || 0).toFixed(2)}</p>
                  </div>
                )}
                {selectedProduct.status && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <Badge variant={selectedProduct.status === 'approved' ? 'default' : selectedProduct.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {selectedProduct.status}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                <p className="leading-relaxed text-gray-700 dark:text-gray-300 break-words">{selectedProduct.description || selectedProduct.desc || 'No description provided.'}</p>
              </div>

              {selectedProduct.created_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted</p>
                  <p className="text-gray-600 dark:text-gray-400">{formatTimeAgo(selectedProduct.created_at)}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-end mt-4 pt-4 border-t bg-background flex-shrink-0">
            {selectedProduct && (
              <Fragment>
                <Button
                  variant="outline"
                  className="text-red-600 w-full sm:w-auto"
                  disabled={isReadOnly}
                  onClick={() => {
                    if (selectedProduct.id) {
                      handleReject(selectedProduct.id);
                    } else {
                      setIsProductModalOpen(false);
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="outline" 
                  className="text-orange-600 w-full sm:w-auto"
                  disabled={isReadOnly}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flag for Review
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  disabled={isReadOnly}
                  onClick={() => {
                    if (selectedProduct.id) {
                      handleApprove(selectedProduct.id);
                    } else {
                      setIsProductModalOpen(false);
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </Fragment>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <Tabs defaultValue={canViewPendingProducts ? "pending" : "live"} className="space-y-6">
        <TabsList>
          {canViewPendingProducts && (
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Approvals
              <Badge variant="secondary">{pendingProducts.length}</Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="live" className="gap-2">
            <Timer className="h-4 w-4" />
            Live Auctions
            <Badge variant="secondary">{liveAuctions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Trophy className="h-4 w-4" />
            Completed
            <Badge variant="secondary">{completedAuctions.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {canViewPendingProducts && (
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
                                  src={product.image_url || product.image || ''}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
                                    }
                                  }}
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
                              {isSuperAdmin && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => {
                                      setSelectedProduct(product);
                                      setIsProductModalOpen(true);
                                    }}
                                    title="Edit Product"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(product.id, product.title || product.name || 'Product')}
                                    title="Delete Product"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
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
        )}

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
                        {auction.hours_left ? `${Math.floor(auction.hours_left)}h ${Math.floor((auction.hours_left % 1) * 60)}m` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={async () => {
                          try {
                            const productData = await apiService.getProductById(auction.id);
                            setSelectedProduct(productData);
                            setIsProductModalOpen(true);
                          } catch (error) {
                            setSelectedProduct(auction);
                            setIsProductModalOpen(true);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {isSuperAdmin && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            title="Edit Product"
                            onClick={async () => {
                              try {
                                const productData = await apiService.getProductById(auction.id);
                                setSelectedProduct(productData);
                                setIsProductModalOpen(true);
                              } catch (error) {
                                setSelectedProduct(auction);
                                setIsProductModalOpen(true);
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(auction.id, auction.title || auction.name || 'Product')}
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <InlineLoader message="Loading completed auctions..." />
            </div>
          ) : completedAuctions.length > 0 ? (
            completedAuctions.slice((completedPage - 1) * 8, completedPage * 8).map(auction => (
              <Card key={auction.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-900 dark:text-white mb-1">
                        {auction.title || auction.name || 'Untitled Auction'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Final Bid:{' '}
                        <span className="text-green-600">
                          ${parseFloat(auction.current_bid || auction.highest_bid || auction.starting_bid || 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      Completed
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Winner</p>
                        <p className="text-sm">{auction.highest_bidder_name || 'No winner'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Seller</p>
                        <p className="text-sm">{auction.seller_name || 'Unknown'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={async () => {
                          try {
                            const productData = await apiService.getProductById(auction.id);
                            setSelectedProduct(productData);
                            setIsProductModalOpen(true);
                          } catch (error) {
                            setSelectedProduct(auction);
                            setIsProductModalOpen(true);
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          window.location.hash = `auction-winner?productId=${auction.id}`;
                        }}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        View Winner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No completed auctions found
            </div>
          )}
          {completedTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={completedPage === 1}
                onClick={() => setCompletedPage(completedPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {completedPage} of {completedTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={completedPage === completedTotalPages}
                onClick={() => setCompletedPage(completedPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
