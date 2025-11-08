import { useState } from 'react';
import { Phone, Shield, KeyRound, Users, Eye as EyeIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { apiService } from '../services/api';
import React from 'react';

const BASE_URL = import.meta.env.VITE_BASE_URL || import.meta.env.REACT_APP_BASE_URL || 'http://localhost:5000/api';

/**
 * Normalize Iraq phone number
 * Supports: +964, 964, 00964, or leading 0 (e.g., 07701234567)
 */
function normalizeIraqPhone(phone) {
  if (!phone) return null;
  
  // Remove spaces and special characters except +
  let cleaned = phone.replace(/[\s-]/g, '');
  
  // If starts with 0, replace with +964 (e.g., 07701234567 → +9647701234567)
  if (cleaned.startsWith('0')) {
    cleaned = '+964' + cleaned.substring(1);
  }
  // If starts with 00964, replace with +964
  else if (cleaned.startsWith('00964')) {
    cleaned = '+964' + cleaned.substring(5);
  }
  // If starts with 964, add +
  else if (cleaned.startsWith('964')) {
    cleaned = '+' + cleaned;
  }
  // If doesn't start with +964, return null
  else if (!cleaned.startsWith('+964')) {
    return null;
  }
  
  return cleaned;
}

/**
 * Validate Iraq phone number
 * Must start with +964, 964, 00964, or 0
 * Format: +964 followed by 9-10 digits
 */
function isValidIraqPhone(phone) {
  const normalized = normalizeIraqPhone(phone);
  if (!normalized) return false;
  
  // Iraq phone format: +964 followed by 9-10 digits
  const phoneRegex = /^\+964[0-9]{9,10}$/;
  return phoneRegex.test(normalized);
}

export function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock phone numbers for each role
  const rolePhones = {
    'superadmin': '+9647701234567',
    'moderator': '+9647701234568',
    'viewer': '+9647701234569'
  };

  const roles = [
    {
      id: 'superadmin',
      label: 'Super Admin',
      subtitle: 'Full Access',
      icon: Shield,
      color: 'blue',
      phone: rolePhones.superadmin
    },
    {
      id: 'moderator',
      label: 'Moderator',
      subtitle: 'Manage users/products/orders',
      icon: Users,
      color: 'purple',
      phone: rolePhones.moderator
    },
    {
      id: 'viewer',
      label: 'Viewer',
      subtitle: 'Read-only access to analytics',
      icon: EyeIcon,
      color: 'green',
      phone: rolePhones.viewer
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    setPhone(role.phone);
    setPhoneError('');
    setError('');
    setOtpSent(false);
    setOtp('');
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    setPhoneError('');
    setError('');
  };

  const handleSendOTP = async () => {
    setError('');
    setPhoneError('');

    if (!phone) {
      setPhoneError('Phone number is required');
      return;
    }

    if (!isValidIraqPhone(phone)) {
      setPhoneError('Invalid phone number. Use Iraq format: +964XXXXXXXXXX');
      return;
    }

    // For mock OTP, we don't need to call backend - just show OTP input
    setOtpSent(true);
    setOtp('1234'); // Auto-fill mock OTP
  };

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 4) {
      setOtp(value);
      setError('');
    }
  };

  const handleVerifyOTP = async () => {
    setError('');

    if (!otp || otp.length !== 4) {
      setError('Please enter 4-digit OTP');
      return;
    }

    if (otp !== '1234') {
      setError('Invalid OTP. Use 1234 for testing.');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizeIraqPhone(phone);
      
      // Call backend login-phone endpoint
      const response = await fetch(`${BASE_URL}/auth/login-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        // Extract role from response
        const role = data.role || data.user?.role;
        
        // Map backend role to frontend format
        const mappedRole = role === 'superadmin' ? 'super-admin' : role;
        
        // Call onLogin with role and token
        onLogin(mappedRole, data.token);
        
        // Redirect based on role
        if (role === 'superadmin') {
          window.location.hash = 'dashboard';
        } else if (role === 'moderator') {
          window.location.hash = 'moderator-dashboard';
        } else if (role === 'viewer') {
          window.location.hash = 'viewer-dashboard';
        } else {
          window.location.hash = 'dashboard';
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setPhoneError('');
  };

  // Get role display name for OTP screen
  const getRoleDisplayName = () => {
    if (!selectedRole) return 'Admin';
    if (selectedRole === 'superadmin') return 'Super Admin';
    if (selectedRole === 'moderator') return 'Moderator';
    if (selectedRole === 'viewer') return 'Viewer';
    return 'Admin';
  };

  // Get role color class for title
  const getRoleColorClass = () => {
    if (!selectedRole) return 'text-gray-900 dark:text-white';
    if (selectedRole === 'superadmin') return 'text-blue-600 dark:text-blue-400';
    if (selectedRole === 'moderator') return 'text-purple-600 dark:text-purple-400';
    if (selectedRole === 'viewer') return 'text-green-600 dark:text-green-400';
    return 'text-gray-900 dark:text-white';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className={`text-2xl font-bold ${otpSent ? getRoleColorClass() : 'text-gray-900 dark:text-white'}`}>
            BidMaster {otpSent ? getRoleDisplayName() : 'Admin'}
          </CardTitle>
          <CardDescription>
            {otpSent ? 'Enter OTP to continue' : 'Login with your phone number'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <>
              {/* Role Selection Cards */}
              <div className="space-y-2">
                <Label>Select Role</Label>
                <div className="grid grid-cols-1 gap-2">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.id;
                    const colorClasses = {
                      blue: isSelected 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-blue-300',
                      purple: isSelected 
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-purple-300',
                      green: isSelected 
                        ? 'border-green-600 bg-green-50 dark:bg-green-950' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-green-300'
                    };
                    const iconColorClasses = {
                      blue: isSelected ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                      purple: isSelected ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700',
                      green: isSelected ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    };
                    const checkColorClasses = {
                      blue: 'bg-blue-600',
                      purple: 'bg-purple-600',
                      green: 'bg-green-600'
                    };

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${colorClasses[role.color]}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColorClasses[role.color]}`}>
                            <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{role.label}</p>
                            <p className="text-xs text-gray-500">{role.subtitle}</p>
                          </div>
                          {isSelected && (
                            <div className={`w-5 h-5 ${checkColorClasses[role.color]} rounded-full flex items-center justify-center`}>
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Iraq)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+9647701234567"
                    className="pl-10"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    disabled={loading}
                  />
                </div>
                {phoneError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{phoneError}</p>
                )}
                {selectedRole && (
                  <p className="text-xs text-gray-500">
                    Phone auto-filled for {roles.find(r => r.id === selectedRole)?.label}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <KeyRound className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Mock OTP:</strong> Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">1234</code> for testing
                </p>
              </div>

              <Button
                onClick={handleSendOTP}
                className="w-full"
                disabled={loading || !phone || !selectedRole}
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="1234"
                    className="pl-10 text-center text-2xl tracking-widest"
                    value={otp}
                    onChange={handleOTPChange}
                    maxLength={4}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Enter the 4-digit OTP (Mock: 1234)
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOTP}
                  className="flex-1"
                  disabled={loading || otp.length !== 4}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
