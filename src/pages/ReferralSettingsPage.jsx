import { useState, useEffect } from 'react';
import { Save, Lock, RefreshCw, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner@2.0.3';
import { apiService } from '../services/api';

export function ReferralSettingsPage({ userRole }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [rewardAmount, setRewardAmount] = useState('1.00');

  const isReadOnly = userRole === 'viewer' || userRole === 'moderator';
  const canEdit = userRole === 'super-admin';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getReferralSettings();

      if (response.success && response.data) {
        const amount = response.data.referral_reward_amount?.value || '1.00';
        setRewardAmount(amount);
      } else {
        setError(response.message || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Error loading referral settings:', err);
      setError(err.response?.data?.message || 'Failed to load referral settings');
      toast.error('Failed to load referral settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to modify referral settings');
      return;
    }

    const amount = parseFloat(rewardAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid reward amount');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await apiService.updateReferralSettings({
        referral_reward_amount: amount
      });

      if (response.success) {
        toast.success('Referral settings updated successfully');
      } else {
        setError(response.message || 'Failed to update settings');
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating referral settings:', err);
      setError(err.response?.data?.message || 'Failed to update referral settings');
      toast.error(err.response?.data?.message || 'Failed to update referral settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Warning */}
      {isReadOnly && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg flex items-start gap-3">
          <Lock className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm text-orange-900 dark:text-orange-100">Read-Only Mode</p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
              {userRole === 'viewer' 
                ? 'You are logged in as a Viewer. You can view settings but cannot make changes.'
                : 'You are logged in as a Moderator. Only Super Admins can modify referral settings.'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-gray-900 dark:text-white mb-1">Referral Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Configure referral system settings</p>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Reward Configuration
          </CardTitle>
          <CardDescription>
            Set the default reward amount for successful referrals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading settings...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button variant="outline" onClick={loadSettings}>
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reward-amount">Referral Reward Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="reward-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1.00"
                    className="pl-10"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This amount will be awarded to users when their referrals complete OTP verification.
                </p>
              </div>

              {canEdit && (
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button variant="outline" onClick={loadSettings} disabled={saving}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Referral System Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">1.</span>
              <p>Users receive a unique 6-character referral code when they sign up.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">2.</span>
              <p>When a new user signs up using a referral code, a referral transaction is created with status "pending".</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">3.</span>
              <p>When the invitee completes OTP verification, the reward is automatically awarded to the inviter.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">4.</span>
              <p>The inviter's reward balance increases by the configured amount.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">5.</span>
              <p>Admins can revoke awarded transactions if needed, which will deduct the amount from the inviter's balance.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

