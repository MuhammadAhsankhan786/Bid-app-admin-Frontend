import { useState, useEffect } from 'react';
import { Search, Filter, Download, MoreVertical, Eye, UserX, UserCheck, Edit, Shield, Lock, UserPlus, DollarSign, RefreshCw, Users } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { UserRole } from './LoginPage';
import { toast } from 'sonner@2.0.3';
import { apiService } from '../../src/services/api';

// User interface with referral fields
interface User {
  id: number;
  name: string;
  email: string;
  role: string; // Display label
  roleValue?: string; // Original backend role value for operations
  status: string;
  joined: string;
  bids?: number;
  referral_code?: string;
  referred_by?: string;
  reward_balance?: number;
  showAdjustModal?: boolean;
}

interface UserManagementPageProps {
  userRole: UserRole;
}

export function UserManagementPage({ userRole }: UserManagementPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false);
  const [selectedRoleForChange, setSelectedRoleForChange] = useState<string>('');
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, [searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await apiService.getUsers(params);
      
      // Helper function to map backend role to display label
      const mapRoleToLabel = (role: string): string => {
        if (!role) return 'N/A';
        const normalizedRole = role.toLowerCase().trim();
        const roleMap: Record<string, string> = {
          'superadmin': 'Super Admin',
          'super_admin': 'Super Admin',
          'admin': 'Super Admin',
          'moderator': 'Moderator',
          'viewer': 'Viewer',
          'employee': 'Employee',
          'seller_products': 'Seller',
          'seller': 'Seller',
          'company_products': 'Employee', // Company products are managed by employees
          'buyer': 'Employee' // Buyer maps to Employee in admin panel
        };
        return roleMap[normalizedRole] || role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
      };
      
      if (response.success && response.data) {
        const usersData = Array.isArray(response.data) ? response.data : response.data.users || [];
        setUsers(usersData.map((user: any) => ({
          id: user.id,
          name: user.name || `${user.phone || 'User'}`,
          email: user.email || '',
          role: mapRoleToLabel(user.role || 'buyer'), // Display label
          roleValue: user.role || 'buyer', // Original backend role value for operations
          status: user.status === 'approved' ? 'Active' : user.status === 'suspended' ? 'Suspended' : 'Pending',
          joined: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
          bids: user.total_bids || 0,
          referral_code: user.referral_code,
          referred_by: user.referred_by,
          reward_balance: user.reward_balance || 0,
        })));
      } else {
        setError(response.message || 'Failed to load users');
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const isReadOnly = userRole === 'viewer';

  const handleActionClick = () => {
    if (isReadOnly) {
      toast.error('You do not have permission to perform this action', {
        description: 'Only Super Admins and Moderators can modify users'
      });
    }
  };

  const handleChangeRoleClick = (user: User) => {
    if (isReadOnly) {
      toast.error('You do not have permission');
      return;
    }
    
    // Check if user is Seller - Seller role cannot be changed
    const currentRoleValue = user.roleValue || (user.role?.toLowerCase() === 'seller' ? 'seller_products' : '');
    if (currentRoleValue === 'seller_products') {
      toast.error('Seller role cannot be changed');
      return;
    }
    
    setSelectedUser(user);
    // Use roleValue (backend enum) directly - this is the source of truth
    // roleValue comes from backend API response (user.role field)
    let initialRole = user.roleValue;
    
    // Fallback: If roleValue not available, map from display label to backend enum
    if (!initialRole) {
      const roleLabel = user.role?.toLowerCase();
      if (roleLabel === 'super admin') initialRole = 'superadmin';
      else if (roleLabel === 'moderator') initialRole = 'moderator';
      else if (roleLabel === 'viewer') initialRole = 'viewer';
      else if (roleLabel === 'employee') {
        // Employee can be either 'employee' or 'company_products' in backend
        // Default to 'employee', user can change if needed
        initialRole = 'employee';
      }
      else if (roleLabel === 'seller') initialRole = 'seller_products';
      else initialRole = 'employee'; // fallback
    }
    
    // Normalize company_products to employee (they both represent Employee role in admin panel)
    if (initialRole === 'company_products') {
      initialRole = 'employee';
    }
    
    // Ensure we have a valid backend enum value
    const validBackendRoles = ['superadmin', 'moderator', 'viewer', 'employee', 'seller_products'];
    if (!initialRole || !validBackendRoles.includes(initialRole)) {
      console.warn('Invalid role value, defaulting to employee:', initialRole);
      initialRole = 'employee';
    }
    
    setSelectedRoleForChange(initialRole);
    setIsRoleChangeModalOpen(true);
  };

  const handleSaveRoleChange = async () => {
    if (!selectedUser || !selectedRoleForChange) {
      toast.error('Please select a role');
      return;
    }

    if (isReadOnly) {
      toast.error('You do not have permission');
      return;
    }

    // UI Restriction: Block Employee ↔ Seller conversion
    const currentRoleValue = selectedUser.roleValue || (selectedUser.role?.toLowerCase() === 'seller' ? 'seller_products' : 'employee');
    
    // Block changing TO Seller
    if (selectedRoleForChange === 'seller_products') {
      toast.error('Cannot change role to Seller. Seller role is fixed.');
      return;
    }
    
    // Block changing FROM Seller (already handled in handleChangeRoleClick, but double-check)
    if (currentRoleValue === 'seller_products') {
      toast.error('Seller role cannot be changed');
      return;
    }

    // Ensure we're sending backend enum value, not UI label
    let backendRoleValue = selectedRoleForChange; // This should already be backend enum
    
    // Normalize company_products to employee (they both represent Employee role)
    if (backendRoleValue === 'company_products') {
      backendRoleValue = 'employee';
    }
    
    // Validate backend enum value before sending
    const validBackendRoles = ['superadmin', 'moderator', 'viewer', 'employee', 'seller_products'];
    if (!validBackendRoles.includes(backendRoleValue)) {
      toast.error('Invalid role value. Please try again.');
      console.error('Invalid role value sent to API:', backendRoleValue);
      return;
    }

    try {
      setIsChangingRole(true);
      
      // Send backend enum value to API (not UI label)
      const response = await apiService.updateUserRole(selectedUser.id, backendRoleValue);
      
      if (response?.message || response?.user) {
        // Success: Show toast, close modal, refresh list
        toast.success(response.message || 'User role updated successfully');
        setIsRoleChangeModalOpen(false);
        setSelectedUser(null);
        setSelectedRoleForChange('');
        await loadUsers(); // Refresh user list
      } else {
        toast.error('Role change completed but unexpected response format');
        await loadUsers(); // Still reload in case it worked
      }
    } catch (error: any) {
      console.error('Change role error:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to update user role';
      toast.error(errorMessage);
    } finally {
      setIsChangingRole(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">User Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage all platform users</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Download className="h-4 w-4 mr-2" />
          Export Users
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="seller_products">Seller</SelectItem>
                <SelectItem value="company_products">Employee</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `Total: ${users.length} users`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={loadUsers}>
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Total Bids</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          user.status === 'Active' ? 'default' :
                          user.status === 'Suspended' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {user.joined}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.bids}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isReadOnly}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            if (isReadOnly) {
                              handleActionClick();
                              return;
                            }
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          {!isReadOnly && user.roleValue !== 'seller_products' && user.role?.toLowerCase() !== 'seller' && (
                            <DropdownMenuItem onClick={() => handleChangeRoleClick(user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                          )}
                          {user.status === 'Active' ? (
                            <DropdownMenuItem className="text-red-600">
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing 1 to {users.length} of {users.length} results
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>View and edit user details</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p>{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select defaultValue={selectedUser.roleValue ? selectedUser.roleValue.toLowerCase() : selectedUser.role.toLowerCase()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="seller_products">Seller</SelectItem>
                      <SelectItem value="company_products">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue={selectedUser.status.toLowerCase()}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Joined Date</p>
                  <p className="text-sm">{selectedUser.joined}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Bids</p>
                  <p className="text-sm">{selectedUser.bids}</p>
                </div>
              </div>

              {/* Referral Section */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Referral Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Referral Code</p>
                    <p className="text-sm font-mono font-semibold">{selectedUser.referral_code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Referred By</p>
                    <p className="text-sm">{selectedUser.referred_by || 'None'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Reward Balance</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                      ${parseFloat(selectedUser.reward_balance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                {(userRole === 'super-admin' || userRole === 'moderator') && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsAdjustBalanceModalOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Adjust Reward Balance
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Modal */}
      <Dialog open={isAdjustBalanceModalOpen} onOpenChange={setIsAdjustBalanceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Reward Balance</DialogTitle>
            <DialogDescription>
              Adjust the reward balance for {selectedUser?.name}. Use positive values to add, negative to deduct.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance:</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ${parseFloat((selectedUser.reward_balance || 0).toString()).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjust-amount">Adjustment Amount ($)</Label>
                <Input
                  id="adjust-amount"
                  type="number"
                  step="0.01"
                  placeholder="e.g., -2.00 to deduct, +5.00 to add"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enter positive value to add, negative value to deduct
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjust-reason">Reason (Optional)</Label>
                <Input
                  id="adjust-reason"
                  placeholder="e.g., Fraudulent referral, Manual adjustment"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdjustBalanceModalOpen(false);
                setAdjustAmount('');
                setAdjustReason('');
              }}
              disabled={isAdjusting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedUser) return;

                const amount = parseFloat(adjustAmount);
                if (isNaN(amount) || amount === 0) {
                  toast.error('Please enter a valid adjustment amount');
                  return;
                }

                try {
                  setIsAdjusting(true);
                  const response = await apiService.adjustUserRewardBalance(selectedUser.id, {
                    amount,
                    reason: adjustReason || null
                  });

                  if (response.success) {
                    toast.success(`Reward balance adjusted by $${amount.toFixed(2)}`);
                    setIsAdjustBalanceModalOpen(false);
                    setAdjustAmount('');
                    setAdjustReason('');
                    // Update selectedUser balance
                    setSelectedUser({
                      ...selectedUser,
                      reward_balance: response.data.new_balance
                    });
                  } else {
                    toast.error(response.message || 'Failed to adjust balance');
                  }
                } catch (err: any) {
                  console.error('Error adjusting balance:', err);
                  toast.error(err.response?.data?.message || 'Failed to adjust balance');
                } finally {
                  setIsAdjusting(false);
                }
              }}
              disabled={isAdjusting}
            >
              {isAdjusting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adjusting...
                </>
              ) : (
                'Adjust Balance'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={isRoleChangeModalOpen} onOpenChange={setIsRoleChangeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Update the role for this user</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Current Role: {selectedUser.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>New Role</Label>
                <Select 
                  value={selectedRoleForChange} 
                  onValueChange={setSelectedRoleForChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    {/* Seller option disabled - Employee ↔ Seller conversion not allowed */}
                    <SelectItem value="seller_products" disabled>Seller (Cannot change to Seller)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRoleChangeModalOpen(false);
                    setSelectedUser(null);
                    setSelectedRoleForChange('');
                  }}
                  disabled={isChangingRole}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRoleChange}
                  disabled={isChangingRole || !selectedRoleForChange}
                >
                  {isChangingRole ? 'Updating...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
