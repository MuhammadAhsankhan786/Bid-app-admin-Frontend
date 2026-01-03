import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Save, X, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner@2.0.3';
import { apiService } from '../services/api';

export function BannerManagementPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    displayOrder: 0,
    isActive: true,
    imageUrl: '',
    imageFile: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBanners();
      if (response.success) {
        setBanners(response.data || []);
      } else {
        console.warn('Banners API returned success: false', response);
        setBanners([]);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load banners';

      // Don't show error toast if it's just 404 (no banners yet) or network error
      if (error.response?.status === 404) {
        console.log('No banners found (404) - this is normal if no banners are created yet');
        setBanners([]);
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else {
        toast.error(errorMessage);
      }
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      link: '',
      displayOrder: 0,
      isActive: true,
      imageUrl: '',
      imageFile: null
    });
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      link: banner.link || '',
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive !== false,
      imageUrl: banner.imageUrl || '',
      imageFile: null
    });
    setImagePreview(banner.imageUrl || null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPG, PNG, or WebP)');
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, imageFile: file, imageUrl: '' });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.imageFile && !formData.imageUrl && !editingBanner) {
      toast.error('Please upload an image or provide an image URL');
      return;
    }

    try {
      const formDataToSend = new FormData();

      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      } else if (formData.imageUrl && !editingBanner) {
        formDataToSend.append('imageUrl', formData.imageUrl);
      } else if (formData.imageUrl && editingBanner) {
        formDataToSend.append('imageUrl', formData.imageUrl);
      }

      if (formData.title) {
        formDataToSend.append('title', formData.title);
      }
      if (formData.link) {
        formDataToSend.append('link', formData.link);
      }
      formDataToSend.append('displayOrder', formData.displayOrder || 0);
      formDataToSend.append('isActive', formData.isActive);

      if (editingBanner) {
        await apiService.updateBanner(editingBanner.id, formDataToSend);
        toast.success('Banner updated successfully');
      } else {
        await apiService.createBanner(formDataToSend);
        toast.success('Banner created successfully');
      }
      setIsDialogOpen(false);
      loadBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error(error.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (banner) => {
    if (!confirm(`Are you sure you want to delete banner "${banner.title || 'Untitled'}"?`)) {
      return;
    }

    try {
      await apiService.deleteBanner(banner.id);
      toast.success('Banner deleted successfully');
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error(error.response?.data?.message || 'Failed to delete banner');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Banner Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage homepage banner carousel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadBanners} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Banners</CardTitle>
          <CardDescription>
            {banners.length} banner(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading banners...</span>
            </div>
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No banners found</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Banner
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title || 'Banner'}
                          className="w-20 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="48"%3E%3Crect fill="%23ddd" width="80" height="48"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{banner.title || 'Untitled'}</TableCell>
                    <TableCell>
                      {banner.link ? (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {banner.link.length > 30 ? banner.link.substring(0, 30) + '...' : banner.link}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">No link</span>
                      )}
                    </TableCell>
                    <TableCell>{banner.displayOrder || 0}</TableCell>
                    <TableCell>
                      <Badge variant={banner.isActive !== false ? 'default' : 'secondary'}>
                        {banner.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {banner.createdAt ? new Date(banner.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(banner)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Edit Banner' : 'Create Banner'}
            </DialogTitle>
            <DialogDescription>
              {editingBanner ? 'Update banner information' : 'Add a new banner to the carousel'}
            </DialogDescription>
          </DialogHeader>

          {/* Content Area */}
          <div className="space-y-4">
            {/* Banner Size Requirements */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Recommended Banner Size for Flutter App:
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>1920 x 600 pixels</strong> (16:5 ratio)<br />
                    Max file size: 5MB<br />
                    Formats: JPG, PNG, WebP
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label htmlFor="image" className="text-base font-medium">
                Banner Image <span className="text-red-500">*</span>
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="mt-2 cursor-pointer"
              />
              {!formData.imageFile && (
                <div className="mt-2">
                  <Label htmlFor="imageUrl" className="text-sm text-gray-600 dark:text-gray-400">
                    Or paste image URL:
                  </Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      if (e.target.value) {
                        setImagePreview(e.target.value);
                      }
                    }}
                    placeholder="https://example.com/banner.jpg"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div>
                <Label className="text-sm font-medium">Preview</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 p-2">
                  <div className="relative w-full" style={{ aspectRatio: '16/5', minHeight: '120px', maxHeight: '200px' }}>
                    <img
                      src={imagePreview}
                      alt="Banner Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">Failed to load image</div>';
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Title - Optional */}
            <div>
              <Label htmlFor="title" className="text-sm">Title (Optional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Banner Title"
                className="mt-1"
              />
            </div>

            {/* Link URL - Optional */}
            <div>
              <Label htmlFor="link" className="text-sm">Link URL (Optional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Where to navigate when banner is clicked
              </p>
            </div>

            {/* Display Order */}
            <div>
              <Label htmlFor="displayOrder" className="text-sm">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first (0 = first position)
              </p>
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded w-4 h-4"
              />
              <Label htmlFor="isActive" className="text-sm cursor-pointer">
                Active (Show on homepage)
              </Label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {editingBanner ? 'Update Banner' : 'Create Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

