// FULL UPDATED ProductManagementPage.jsx — FIXED MODAL OVERFLOW + FIXED JSX + CLEANED STRUCTURE
// 100% READY TO USE

import { useState, useEffect, Fragment } from 'react';
import { Search, Clock, CheckCircle, XCircle, Flag, Eye, Timer, Lock, Edit, Trash2, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    starting_bid: '',
    image_url: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [completedAuctions, setCompletedAuctions] = useState([]);
  const [rejectedProducts, setRejectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingPage, setPendingPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [liveTotalPages, setLiveTotalPages] = useState(1);
  const [completedTotalPages, setCompletedTotalPages] = useState(1);
  const [rejectedTotalPages, setRejectedTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState(canViewPendingProducts ? 'pending' : 'live');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isReadOnly = userRole === 'viewer';
  const canDelete = userRole === 'superadmin' || userRole === 'super-admin';
  
  // Debug: Log role information
  console.log('[ProductManagement] User Role:', userRole);
  console.log('[ProductManagement] Can Delete:', canDelete);
  console.log('[ProductManagement] Is Read Only:', isReadOnly);

  useEffect(() => {
    loadProducts();
  }, [completedPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const promises = [
        canViewPendingProducts
          ? apiService.getPendingProducts().catch(() => [])
          : Promise.resolve([]),
        apiService.getLiveAuctions().catch(() => []),
        apiService.getCompletedProducts({ page: completedPage, limit: 20 }).catch(() => ({ products: [], pagination: { total: 0, pages: 1 } })),
        apiService.getRejectedProducts().catch(() => [])
      ];

      const [pendingResponse, liveResponse, completedResponse, rejectedResponse] = await Promise.all(promises);

      const pending = Array.isArray(pendingResponse) ? pendingResponse : pendingResponse?.products || [];
      const live = Array.isArray(liveResponse) ? liveResponse : liveResponse?.auctions || [];
      const completed = Array.isArray(completedResponse?.products) ? completedResponse.products : (Array.isArray(completedResponse) ? completedResponse : []);
      const rejected = Array.isArray(rejectedResponse) ? rejectedResponse : rejectedResponse?.products || [];

      setPendingProducts(pending);
      setLiveAuctions(live);
      setCompletedAuctions(completed);
      setRejectedProducts(rejected);
      setPendingTotalPages(Math.ceil(pending.length / 10));
      setLiveTotalPages(Math.ceil(live.length / 8));
      setCompletedTotalPages(completedResponse?.pagination?.pages || Math.ceil(completed.length / 8));
      setRejectedTotalPages(Math.ceil(rejected.length / 10));

      if (pending.length === 0 && live.length === 0 && completed.length === 0 && rejected.length === 0) {
        toast.info('No products found.');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
      setPendingProducts([]);
      setLiveAuctions([]);
      setCompletedAuctions([]);
      setRejectedProducts([]);
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
      
      // Refresh only the active tab
      if (activeTab === 'pending') {
        await reloadPending();
      } else if (activeTab === 'rejected') {
        await reloadRejected();
      } else {
        await loadProducts();
      }
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleEditToggle = () => {
    if (selectedProduct) {
      setIsEditMode(!isEditMode);
      if (!isEditMode) {
        // Initialize form data when entering edit mode
        const imageUrl = Array.isArray(selectedProduct.image_url) 
          ? selectedProduct.image_url[0] || selectedProduct.image_url 
          : selectedProduct.image_url || selectedProduct.image || '';
        
        setEditFormData({
          title: selectedProduct.title || selectedProduct.name || '',
          description: selectedProduct.description || selectedProduct.desc || '',
          starting_bid: selectedProduct.starting_bid || selectedProduct.startingBid || selectedProduct.price || '',
          image_url: imageUrl
        });
        
        console.log('[Edit] Form initialized with:', {
          title: selectedProduct.title || selectedProduct.name || '',
          description: selectedProduct.description || selectedProduct.desc || '',
          starting_bid: selectedProduct.starting_bid || selectedProduct.startingBid || selectedProduct.price || '',
          image_url: imageUrl
        });
      } else {
        // Reset form when canceling
        setEditFormData({
          title: '',
          description: '',
          starting_bid: '',
          image_url: ''
        });
      }
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct?.id) return;
    
    setIsUpdating(true);
    try {
      console.log('[Update] Updating product:', selectedProduct.id);
      console.log('[Update] Form data:', editFormData);
      
      const updateData = {
        title: editFormData.title,
        description: editFormData.description,
        startingPrice: parseFloat(editFormData.starting_bid) || 0,
        image_url: editFormData.image_url
      };
      
      const response = await apiService.updateProduct(selectedProduct.id, updateData);
      console.log('[Update] Product updated successfully:', response);
      
      toast.success('Product updated successfully');
      setIsEditMode(false);
      
      // Refresh the active tab
      if (activeTab === 'pending') {
        await reloadPending();
      } else if (activeTab === 'live') {
        await reloadLive();
      } else if (activeTab === 'completed') {
        await reloadCompleted();
      } else if (activeTab === 'rejected') {
        await reloadRejected();
      }
      
      // Reload the product data
      const updatedProduct = await apiService.getProductById(selectedProduct.id);
      const productData = updatedProduct?.data || updatedProduct?.product || updatedProduct;
      setSelectedProduct(productData);
      
    } catch (error) {
      console.error('[Update] Error updating product:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update product';
      toast.error('Failed to update product', { description: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (id) => {
    if (isReadOnly) return toast.error('Viewer cannot reject');
    try {
      await apiService.rejectProduct(id, { reason: 'Rejected by admin' });
      toast.success('Product rejected');
      setIsProductModalOpen(false);
      
      // Refresh only the active tab
      if (activeTab === 'pending') {
        await reloadPending();
      } else {
        await loadProducts();
      }
    } catch {
      toast.error('Failed to reject');
    }
  };

  const reloadPending = async () => {
    const pending = await apiService.getPendingProducts().catch(() => []);
    setPendingProducts(Array.isArray(pending) ? pending : pending?.products || []);
    setPendingTotalPages(Math.ceil((Array.isArray(pending) ? pending : pending?.products || []).length / 10));
  };

  const reloadLive = async () => {
    const live = await apiService.getLiveAuctions().catch(() => []);
    setLiveAuctions(Array.isArray(live) ? live : live?.auctions || []);
    setLiveTotalPages(Math.ceil((Array.isArray(live) ? live : live?.auctions || []).length / 8));
  };

  const reloadCompleted = async () => {
    const completed = await apiService.getCompletedProducts({ page: completedPage, limit: 20 }).catch(() => ({ products: [], pagination: { total: 0, pages: 1 } }));
    setCompletedAuctions(Array.isArray(completed?.products) ? completed.products : (Array.isArray(completed) ? completed : []));
    setCompletedTotalPages(completed?.pagination?.pages || Math.ceil((Array.isArray(completed?.products) ? completed.products : (Array.isArray(completed) ? completed : [])).length / 8));
  };

  const reloadRejected = async () => {
    const rejected = await apiService.getRejectedProducts().catch(() => []);
    setRejectedProducts(Array.isArray(rejected) ? rejected : rejected?.products || []);
    setRejectedTotalPages(Math.ceil((Array.isArray(rejected) ? rejected : rejected?.products || []).length / 10));
  };

  const handleDeleteClick = (id, name) => {
    console.log('[Delete] Button clicked:', { id, name, canDelete, userRole });
    if (!canDelete) {
      toast.error('Access denied', { description: 'Only Super Admin can delete products' });
      return;
    }
    console.log('[Delete] Opening modal for product:', id);
    setSelectedProductId(id);
    setSelectedProductName(name);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProductId) {
      console.error('[Delete] No product ID selected');
      return;
    }
    
    console.log('[Delete] Confirming deletion for product:', selectedProductId);
    setIsDeleting(true);
    try {
      console.log('[Delete] Calling API to delete product:', selectedProductId);
      const response = await apiService.deleteProduct(selectedProductId);
      console.log('[Delete] API response:', response);
      toast.success('Product deleted successfully');
      setShowDeleteModal(false);
      setSelectedProductId(null);
      setSelectedProductName(null);
      
      // Refresh only the active tab
      console.log('[Delete] Refreshing active tab:', activeTab);
      if (activeTab === 'pending') {
        await reloadPending();
      } else if (activeTab === 'live') {
        await reloadLive();
      } else if (activeTab === 'completed') {
        await reloadCompleted();
      } else if (activeTab === 'rejected') {
        await reloadRejected();
      }
      
      setIsProductModalOpen(false);
    } catch (error) {
      console.error("[Delete] Error deleting product:", error);
      console.error("[Delete] Error response:", error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete product';
      toast.error('Failed to delete product', { 
        description: errorMessage 
      });
    } finally {
      setIsDeleting(false);
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

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The product "{selectedProductName}" will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex flex-row justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProductId(null);
                setSelectedProductName(null);
              }}
              disabled={isDeleting}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[80px]"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductModalOpen} onOpenChange={(open) => {
        setIsProductModalOpen(open);
        if (!open) {
          setIsEditMode(false);
          setEditFormData({ title: '', description: '', starting_bid: '', image_url: '' });
        }
      }}>
        <DialogContent
          className="max-w-[400px] w-[85vw] sm:w-[90vw] md:w-[450px]
                     max-h-[60vh] sm:max-h-[55vh] md:max-h-[65vh]
                     p-2.5 sm:p-3 md:p-4
                     flex flex-col overflow-hidden
                     mx-auto"
        >
          <DialogHeader className="flex-shrink-0 pb-1 sm:pb-1.5">
            <div className="flex items-start justify-between gap-1.5 sm:gap-2">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-sm sm:text-base md:text-lg">{isEditMode ? 'Edit Product' : 'Product Details'}</DialogTitle>
                <DialogDescription className="text-[10px] sm:text-xs">
                  {isEditMode ? 'Update product information' : (selectedProduct ? 'Review product details' : 'Loading...')}
                </DialogDescription>
              </div>
              {isSuperAdmin && selectedProduct && !isEditMode && activeTab !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                  className="ml-auto flex-shrink-0 h-7 sm:h-8 px-2 sm:px-3"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline text-xs">Edit</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedProduct ? (
            <div className="space-y-1.5 sm:space-y-2 flex-1 overflow-y-auto min-h-0">
              {isEditMode ? (
                // Edit Form - Clear and User-Friendly
                <div className="space-y-4 sm:space-y-5">
                  {/* Info Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">✏️</span>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Edit Product Information</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Update the fields below. Fields marked with <span className="text-red-500 font-bold">*</span> are required.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Editable Fields */}
                  <div className="space-y-4">
                    {/* Product Name */}
                    <div>
                      <Label htmlFor="edit-title" className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">
                        Product Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-title"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder="e.g., Apple iPhone 15 Pro Max"
                        className="text-sm"
                      />
                      {!editFormData.title && (
                        <p className="text-xs text-red-500 mt-1.5">⚠️ Product name is required</p>
                      )}
                    </div>
                    
                    {/* Description */}
                    <div>
                      <Label htmlFor="edit-description" className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">
                        Product Description
                      </Label>
                      <Textarea
                        id="edit-description"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        placeholder="Describe the product features, condition, specifications, etc..."
                        className="min-h-[100px] sm:min-h-[120px] text-sm"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">💡 Tip: Add detailed information to help buyers make informed decisions</p>
                    </div>
                    
                    {/* Starting Bid */}
                    <div>
                      <Label htmlFor="edit-starting-bid" className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">
                        Starting Bid Amount <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 font-medium">$</span>
                        <Input
                          id="edit-starting-bid"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editFormData.starting_bid}
                          onChange={(e) => setEditFormData({ ...editFormData, starting_bid: e.target.value })}
                          placeholder="2500.00"
                          className="text-sm pl-7"
                        />
                      </div>
                      {!editFormData.starting_bid && (
                        <p className="text-xs text-red-500 mt-1.5">⚠️ Starting bid amount is required</p>
                      )}
                      {editFormData.starting_bid && parseFloat(editFormData.starting_bid) <= 0 && (
                        <p className="text-xs text-red-500 mt-1.5">⚠️ Amount must be greater than $0</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">💰 This is the minimum bid amount for the auction</p>
                    </div>
                    
                    {/* Image URL */}
                    <div>
                      <Label htmlFor="edit-image-url" className="text-sm font-semibold mb-2 block text-gray-900 dark:text-white">
                        Product Image URL
                      </Label>
                      <Input
                        id="edit-image-url"
                        type="url"
                        value={editFormData.image_url}
                        onChange={(e) => setEditFormData({ ...editFormData, image_url: e.target.value })}
                        placeholder="https://example.com/product-image.jpg"
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">📷 Enter a valid image URL (optional)</p>
                    </div>
                    
                    {/* Image Preview */}
                    {editFormData.image_url && (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">📷 Image Preview</p>
                        <div className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[180px] sm:max-h-[220px] min-h-[120px] sm:min-h-[150px] flex items-center justify-center">
                          <img
                            src={editFormData.image_url}
                            alt="Product preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent && !parent.querySelector('.error-msg')) {
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'error-msg w-full h-full flex items-center justify-center text-red-400 text-xs';
                                errorDiv.textContent = '❌ Invalid image URL';
                                parent.appendChild(errorDiv);
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Read-Only Information Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                      <span>ℹ️</span>
                      <span>Information (Cannot be changed)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Category</p>
                        <Badge className="text-xs">{selectedProduct.category_name || selectedProduct.category || 'Uncategorized'}</Badge>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Seller</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProduct.seller_name || selectedProduct.seller || 'Unknown'}</p>
                      </div>
                      {selectedProduct.status && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Status</p>
                          <Badge variant={selectedProduct.status === 'approved' ? 'default' : selectedProduct.status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                            {selectedProduct.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden max-h-[18vh] sm:max-h-[22vh] md:max-h-[25vh] min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex items-center justify-center">
                    <ImageWithFallback
                      src={selectedProduct.image_url || selectedProduct.image || ''}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>`;
                        }
                      }}
                      alt={selectedProduct.title || selectedProduct.name || 'Product'}
                      className="w-full h-full max-h-[18vh] sm:max-h-[22vh] md:max-h-[25vh] object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Product Name</p>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white break-words line-clamp-1">{selectedProduct.title || selectedProduct.name || 'Untitled Product'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Category</p>
                      <Badge className="text-[9px] sm:text-[10px] px-1 py-0.5">{selectedProduct.category_name || selectedProduct.category || 'Uncategorized'}</Badge>
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Seller</p>
                      <p className="text-[10px] sm:text-xs text-gray-900 dark:text-white break-words line-clamp-1">{selectedProduct.seller_name || selectedProduct.seller || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Starting Bid</p>
                      <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white">${parseFloat(selectedProduct.starting_bid || selectedProduct.startingBid || selectedProduct.price || 0).toFixed(2)}</p>
                    </div>
                    {(selectedProduct.current_bid || selectedProduct.highest_bid) && (
                      <div>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current Bid</p>
                        <p className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400">${parseFloat(selectedProduct.current_bid || selectedProduct.highest_bid || 0).toFixed(2)}</p>
                      </div>
                    )}
                    {selectedProduct.status && (
                      <div>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Status</p>
                        <Badge variant={selectedProduct.status === 'approved' ? 'default' : selectedProduct.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[9px] sm:text-[10px] px-1 py-0.5">
                          {selectedProduct.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Description</p>
                    <p className="text-[10px] sm:text-xs leading-tight text-gray-700 dark:text-gray-300 break-words line-clamp-2">{selectedProduct.description || selectedProduct.desc || 'No description provided.'}</p>
                  </div>

                  {selectedProduct.created_at && (
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Submitted</p>
                      <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 dark:text-gray-400">{formatTimeAgo(selectedProduct.created_at)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <InlineLoader message="Loading product details..." />
            </div>
          )}

          <DialogFooter className="gap-1 sm:gap-1.5 md:gap-2 flex-col sm:flex-row sm:justify-end mt-1.5 sm:mt-2 md:mt-3 pt-1.5 sm:pt-2 md:pt-3 border-t bg-background flex-shrink-0">
            {selectedProduct && (
              <Fragment>
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false);
                        // Reset form data
                        setEditFormData({
                          title: '',
                          description: '',
                          starting_bid: '',
                          image_url: ''
                        });
                      }}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      onClick={handleUpdateProduct}
                      disabled={isUpdating || isReadOnly || !editFormData.title || !editFormData.starting_bid}
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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

      <Tabs defaultValue={canViewPendingProducts ? "pending" : "live"} className="space-y-6" onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="w-full min-w-max inline-flex">
            {canViewPendingProducts && (
              <TabsTrigger value="pending" className="gap-2 whitespace-nowrap">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pending Approvals</span>
                <span className="sm:hidden">Pending</span>
                <Badge variant="secondary">{pendingProducts.length}</Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="live" className="gap-2 whitespace-nowrap">
              <Timer className="h-4 w-4" />
              <span className="hidden sm:inline">Live Auctions</span>
              <span className="sm:hidden">Live</span>
              <Badge variant="secondary">{liveAuctions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 whitespace-nowrap">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Completed</span>
              <span className="sm:hidden">Done</span>
              <Badge variant="secondary">{completedAuctions.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2 whitespace-nowrap">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Rejected</span>
              <span className="sm:hidden">Reject</span>
              <Badge variant="secondary">{rejectedProducts.length}</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

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
                            <div className="flex items-center justify-end gap-1 sm:gap-2 flex-wrap">
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={async () => {
                                    console.log('[Edit] Button clicked for product:', product.id);
                                    console.log('[Edit] Current product data:', product);
                                    try {
                                      console.log('[Edit] Fetching product data from API...');
                                      const response = await apiService.getProductById(product.id);
                                      console.log('[Edit] API response:', response);
                                      
                                      // Handle different response structures
                                      const productData = response?.product || response?.data || response;
                                      console.log('[Edit] Extracted product data:', productData);
                                      
                                      if (productData && (productData.id || productData.title || productData.name)) {
                                        setSelectedProduct(productData);
                                        setIsProductModalOpen(true);
                                        console.log('[Edit] Modal opened with product data');
                                      } else {
                                        console.warn('[Edit] Invalid product data, using fallback');
                                        setSelectedProduct(product);
                                        setIsProductModalOpen(true);
                                      }
                                    } catch (error) {
                                      console.error('[Edit] Error fetching product:', error);
                                      console.error('[Edit] Error details:', error.response?.data || error.message);
                                      console.log('[Edit] Using fallback product data');
                                      setSelectedProduct(product);
                                      setIsProductModalOpen(true);
                                    }
                                  }}
                                  title="Edit Product"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('[Delete Button] Clicked - canDelete:', canDelete, 'userRole:', userRole);
                                    handleDeleteClick(product.id, product.title || product.name || 'Product');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isReadOnly}
                                  title="Delete Product"
                                  type="button"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
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

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 min-w-[120px]"
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
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[Delete Button] Clicked - canDelete:', canDelete, 'userRole:', userRole);
                            handleDeleteClick(auction.id, auction.title || auction.name || 'Product');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isReadOnly}
                          title="Delete Product"
                          type="button"
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
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

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 min-w-[100px]"
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
                        <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      <Button 
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 flex-1 min-w-[100px]"
                        onClick={() => {
                          window.location.hash = `auction-winner?productId=${auction.id}`;
                        }}
                      >
                        <Trophy className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View Winner</span>
                        <span className="sm:hidden">Winner</span>
                      </Button>
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('[Delete Button] Clicked - canDelete:', canDelete, 'userRole:', userRole);
                            handleDeleteClick(auction.id, auction.title || auction.name || 'Product');
                          }}
                          className="flex items-center gap-1 px-2 sm:px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isReadOnly}
                          title="Delete Product"
                          type="button"
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
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

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search rejected products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rejected Products</CardTitle>
              <CardDescription>Products that were rejected by admin</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Starting Bid</TableHead>
                    <TableHead>Rejected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <InlineLoader message="Loading rejected products..." />
                      </TableCell>
                    </TableRow>
                  ) : rejectedProducts.filter((p) =>
                    (p.title || p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                  ).slice((rejectedPage - 1) * 10, rejectedPage * 10).length > 0 ? (
                    rejectedProducts.filter((p) =>
                      (p.title || p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                    ).slice((rejectedPage - 1) * 10, rejectedPage * 10).map(product => (
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
                          {formatTimeAgo(product.updated_at || product.created_at)}
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
                            {!isReadOnly && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(product.id)}
                                title="Approve Product"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {isSuperAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={async () => {
                                  try {
                                    const productData = await apiService.getProductById(product.id);
                                    setSelectedProduct(productData);
                                    setIsProductModalOpen(true);
                                  } catch (error) {
                                    console.error('Error fetching product:', error);
                                    setSelectedProduct(product);
                                    setIsProductModalOpen(true);
                                  }
                                }}
                                title="Edit Product"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('[Delete Button] Clicked - canDelete:', canDelete, 'userRole:', userRole);
                                  handleDeleteClick(product.id, product.title || product.name || 'Product');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isReadOnly}
                                title="Delete Product"
                                type="button"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No rejected products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {rejectedTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={rejectedPage === 1}
                onClick={() => setRejectedPage(rejectedPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {rejectedPage} of {rejectedTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={rejectedPage === rejectedTotalPages}
                onClick={() => setRejectedPage(rejectedPage + 1)}
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
