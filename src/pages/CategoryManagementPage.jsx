import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw, Save, X } from 'lucide-react';
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

export function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', active: true });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', active: true });
    setIsDialogOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      active: category.active !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        // Update
        await apiService.put(`/categories/${editingCategory.id}`, formData);
        toast.success('Category updated successfully');
      } else {
        // Create
        if (!formData.slug.trim()) {
          // Generate slug from name
          formData.slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        await apiService.post('/categories', formData);
        toast.success('Category created successfully');
      }
      setIsDialogOpen(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to ${category.active ? 'deactivate' : 'delete'} "${category.name}"?`)) {
      return;
    }

    try {
      await apiService.delete(`/categories/${category.id}`);
      toast.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Category Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage product categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCategories} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {categories.length} category(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No categories found</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-sm">#{category.id}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{category.slug}</TableCell>
                    <TableCell>
                      <Badge variant={category.active !== false ? 'default' : 'secondary'}>
                        {category.active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category information' : 'Add a new product category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Electronics"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="electronics"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated from name if left empty
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Electronic devices and gadgets"
              />
            </div>
            {editingCategory && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="active">Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

