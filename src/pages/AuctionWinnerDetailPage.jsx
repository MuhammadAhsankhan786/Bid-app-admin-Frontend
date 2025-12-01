import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, User, Package, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { apiService } from '../services/api';
import { InlineLoader } from '../components/Loader';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function AuctionWinnerDetailPage({ userRole, productId, onBack }) {
  const [winnerData, setWinnerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadWinnerDetails();
    }
  }, [productId]);

  const loadWinnerDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAuctionWinnerDetails(productId);
      
      if (response.success) {
        setWinnerData(response.data);
      } else {
        toast.error('Failed to load winner details');
      }
    } catch (error) {
      console.error('Error loading winner details:', error);
      toast.error('Failed to load winner details');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <InlineLoader />;
  }

  if (!winnerData) {
    return (
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        <Button variant="outline" onClick={onBack} size="sm" className="flex-shrink-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8 md:py-12 text-center">
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">No winner data found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex items-start gap-3 md:gap-4">
        <Button variant="outline" onClick={onBack} size="sm" className="flex-shrink-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">Auction Winner Details</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 break-words">
            {winnerData.product?.title || 'Product'} - Winner Information
          </p>
        </div>
      </div>

      {/* Product Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {winnerData.product?.image_url && (
              <ImageWithFallback
                src={winnerData.product.image_url}
                alt={winnerData.product.title}
                className="w-full md:w-40 lg:w-48 h-48 md:h-40 lg:h-48 rounded-lg object-cover mx-auto md:mx-0 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold mb-2 break-words">{winnerData.product?.title}</h3>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 break-words">
                {winnerData.product?.description || 'No description'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Starting Bid</p>
                  <p className="font-semibold text-base md:text-lg">{formatCurrency(winnerData.product?.starting_bid)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Final Bid</p>
                  <p className="font-semibold text-base md:text-lg text-green-600">
                    {formatCurrency(winnerData.product?.final_bid)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Auction End</p>
                  <p className="font-medium text-sm md:text-base">{formatDate(winnerData.product?.auction_end_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <Badge variant={winnerData.product?.status === 'sold' ? 'default' : 'secondary'}>
                    {winnerData.product?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Winner Info */}
      {winnerData.winner ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Winner Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Name</p>
                <p className="font-medium text-base break-words">{winnerData.winner.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                <p className="font-medium text-sm break-all">{winnerData.winner.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                <p className="font-medium text-base break-words">{winnerData.winner.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User ID</p>
                <p className="font-mono text-sm break-all">{winnerData.winner.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 md:py-12 text-center">
            <Trophy className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 px-4">No winner - No bids were placed on this auction</p>
          </CardContent>
        </Card>
      )}

      {/* Seller Info */}
      {winnerData.seller && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <User className="h-5 w-5 text-blue-600" />
              Seller Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Name</p>
                <p className="font-medium text-base break-words">{winnerData.seller.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                <p className="font-medium text-sm break-all">{winnerData.seller.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                <p className="font-medium text-base break-words">{winnerData.seller.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bid History */}
      {winnerData.bid_history && winnerData.bid_history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Bid History</CardTitle>
            <CardDescription className="text-sm">
              {winnerData.bid_history.length} total bids
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <div className="inline-block min-w-full align-middle px-4 md:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Bidder</TableHead>
                      <TableHead className="text-sm">Amount</TableHead>
                      <TableHead className="text-sm hidden md:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winnerData.bid_history.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell className="text-sm">
                          <div>
                            <div className="font-medium text-sm md:text-base">{bid.bidder?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500 hidden md:block">{bid.bidder?.email || 'N/A'}</div>
                            <div className="text-xs text-gray-500 md:hidden">{formatDate(bid.created_at)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm md:text-base">
                          {formatCurrency(bid.amount)}
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{formatDate(bid.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


