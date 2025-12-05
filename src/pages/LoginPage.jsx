import { useState } from 'react';
import { Phone, Shield, Users, Eye as EyeIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { apiService } from '../services/api';
import { getScopeFromToken } from '../utils/roleUtils';
import React from 'react';

/**
 * Get API Base URL based on environment
 */
function getBaseUrl() {
  const envUrl = import.meta.env.VITE_BASE_URL || import.meta.env.REACT_APP_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  const isDevelopment = import.meta.env.MODE === 'development' || 
                        import.meta.env.DEV || 
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    return 'http://localhost:5000/api';
  }

  return 'https://api.mazaadati.com/api';
}

const BASE_URL = getBaseUrl();

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
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Phone numbers for each role - These should match the actual numbers in the database
  // Admin Panel uses /api/auth/admin-login which looks up users by phone + role from database
  // Users must enter the actual phone number stored in the database for their role
  const rolePhones = {
    // These are placeholder examples - users should enter their actual database phone numbers
    'superadmin': '',
    'moderator': '',
    'viewer': ''
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
    // Don't auto-fill phone - user must enter their actual database phone number
    setPhone('');
    setPhoneError('');
    setError('');
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    setPhoneError('');
    setError('');
  };

  const handleLogin = async () => {
    setError('');
    setPhoneError('');

    if (!phone) {
      setPhoneError('Phone number is required');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    if (!isValidIraqPhone(phone)) {
      setPhoneError('Invalid phone number. Use Iraq format: +964XXXXXXXXXX');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizeIraqPhone(phone);
      
      // Call POST /auth/admin-login with phone + role (NO OTP)
      const response = await fetch(`${BASE_URL}/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.token) {
        // Extract role from response
        const role = data.role || data.user?.role;
        const normalizedRole = role?.toLowerCase();
        
        // Check if user has admin role (superadmin, admin, moderator, viewer)
        const adminRoles = ['superadmin', 'admin', 'moderator', 'viewer'];
        if (!normalizedRole || !adminRoles.includes(normalizedRole)) {
          console.error('❌ [Admin Panel] Non-admin user attempted login. Role:', normalizedRole);
          localStorage.removeItem('token');
          throw new Error('Access denied. Admin panel is only for administrators. Your account role does not have admin access.');
        }
        
        // Verify token scope is "admin" before storing
        const tokenScope = getScopeFromToken(data.token);
        
        // If scope is "mobile", reject login and clear any existing token
        if (tokenScope === 'mobile') {
          console.error('❌ [Admin Panel] Mobile-scope token received. Admin panel requires admin-scope token.');
          localStorage.removeItem('token');
          throw new Error('Invalid token scope. Admin panel requires admin login. Please use admin credentials.');
        }
        
        // Only allow tokens with scope="admin" or no scope (backward compatibility)
        if (tokenScope && tokenScope !== 'admin') {
          console.error('❌ [Admin Panel] Invalid token scope:', tokenScope);
          localStorage.removeItem('token');
          throw new Error('Invalid token scope. Please contact administrator.');
        }
        
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        // Map backend role to frontend format
        const mappedRole = normalizedRole === 'superadmin' ? 'super-admin' : normalizedRole;
        
        // Call onLogin with role and token
        onLogin(mappedRole, data.token);
        
        // Redirect based on role
        if (normalizedRole === 'superadmin') {
          window.location.hash = 'dashboard';
        } else if (normalizedRole === 'moderator') {
          window.location.hash = 'moderator-dashboard';
        } else if (normalizedRole === 'viewer') {
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

  // Get role display name
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
          <CardTitle className={`text-2xl font-bold ${getRoleColorClass()}`}>
            BidMaster {getRoleDisplayName()}
          </CardTitle>
          <CardDescription>
            Login with your phone number and role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                    placeholder="Enter your admin phone number"
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
                    Enter the phone number registered in the database for {roles.find(r => r.id === selectedRole)?.label}
                  </p>
                )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            className="w-full"
            disabled={loading || !phone || !selectedRole}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
