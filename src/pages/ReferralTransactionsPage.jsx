import { useState, useEffect } from 'react';
import { Search, Filter, Download, XCircle, CheckCircle, Clock, Lock, RefreshCw, Gift } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { toast } from 'sonner@2.0.3';
import { apiService } from '../services/api';

export function ReferralTransactionsPage({ userRole }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [inviterSearch, setInviterSearch] = useState('');
  const [inviteeSearch, setInviteeSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isReadOnly = userRole === 'viewer';
  const canRevoke = userRole === 'super-admin' || userRole === 'moderator';

  useEffect(() => {
    loadReferrals();
  }, [statusFilter, inviterSearch, inviteeSearch, startDate, endDate, page]);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 50,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (inviterSearch) {
        params.inviter_id = inviterSearch;
      }

      if (inviteeSearch) {
        params.invitee_phone = inviteeSearch;
      }

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      const response = await apiService.getReferrals(params);
      
      if (response.success) {
        setTransactions(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        setError(response.message || 'Failed to load referrals');
      }
    } catch (err) {
      console.error('Error loading referrals:', err);
      setError(err.response?.data?.message || 'Failed to load referral transactions');
      toast.error('Failed to load referral transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedTransaction) return;

    try {
      setIsRevoking(true);
      const response = await apiService.revokeReferral(selectedTransaction.id);

      if (response.success) {
        toast.success('Referral transaction revoked successfully');
        setIsRevokeModalOpen(false);
        setSelectedTransaction(null);
        loadReferrals();
      } else {
        toast.error(response.message || 'Failed to revoke referral');
      }
    } catch (err) {
      console.error('Error revoking referral:', err);
      toast.error(err.response?.data?.message || 'Failed to revoke referral');
    } finally {
      setIsRevoking(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'awarded':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Awarded</Badge>;
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Revoked</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              You are logged in as a Viewer. You can view referral transactions but cannot make changes.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Referral Transactions</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and manage all referral transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReferrals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Inviter ID or Phone"
                className="pl-10"
                value={inviterSearch}
                onChange={(e) => {
                  setInviterSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Invitee Phone"
                className="pl-10"
                value={inviteeSearch}
                onChange={(e) => {
                  setInviteeSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Transactions</CardTitle>
          <CardDescription>
            {transactions.length} transaction(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadReferrals}>
                Try Again
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No referral transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Inviter</TableHead>
                      <TableHead>Invitee</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">#{transaction.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{transaction.inviter_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{transaction.inviter_phone}</p>
                            {transaction.inviter_code && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                Code: {transaction.inviter_code}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{transaction.invitee_name || 'Not Registered'}</p>
                            <p className="text-xs text-gray-500">{transaction.invitee_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ${parseFloat(transaction.amount.toString()).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {canRevoke && transaction.status === 'awarded' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setIsRevokeModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Modal */}
      <Dialog open={isRevokeModalOpen} onOpenChange={setIsRevokeModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revoke Referral Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this referral transaction? This will deduct ${selectedTransaction?.amount} from the inviter's reward balance.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-3 sm:space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="text-sm font-mono">#{selectedTransaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Inviter:</span>
                  <span className="text-sm">{selectedTransaction.inviter_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="text-sm font-semibold">${parseFloat(selectedTransaction.amount.toString()).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRevokeModalOpen(false)} disabled={isRevoking} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
              className="w-full sm:w-auto"
            >
              {isRevoking ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Transaction'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

