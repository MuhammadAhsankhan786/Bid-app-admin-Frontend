import { useState } from 'react';
import { Phone, Shield, Users, Eye as EyeIcon, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { apiService } from '../services/api';
import { getScopeFromToken } from '../utils/roleUtils';
import React from 'react';

/**
 * Get API Base URL based on environment
 * Smart logic: Try local first, fallback to production if local fails
 */
function getBaseUrl(forceProduction = false) {
  // If forcing production (after local failed), return production URL
  if (forceProduction) {
    const productionUrl = 'https://api.mazaadati.com/api';
    console.log('🌐 [LoginPage] Using PRODUCTION API (fallback):', productionUrl);
    return productionUrl;
  }

  // Priority 1: Check if running on localhost (TRY local first)
  const hostname = window.location.hostname;
  const port = window.location.port;
  const isLocalhost = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.');

  // If on localhost, TRY local URL first (will fallback to production if fails)
  if (isLocalhost) {
    const localUrl = 'http://localhost:5000/api';
    console.log('🌐 [LoginPage] Localhost detected - Will try LOCAL API first:', localUrl);
    console.log('   💡 If local backend is not running, will auto-fallback to production');
    return localUrl;
  }

  // Priority 2: Check localStorage for manual override (only for non-localhost)
  const storedUrl = localStorage.getItem('API_BASE_URL');
  if (storedUrl && storedUrl.trim() !== '') {
    // SECURITY FIX: If we are on production site, DO NOT allow localhost API from localStorage
    if (!isLocalhost && (storedUrl.includes('localhost') || storedUrl.includes('127.0.0.1'))) {
      console.warn('⚠️ [LoginPage] Ignoring/Removing localhost API URL on production site');
      localStorage.removeItem('API_BASE_URL');
      // Fall through to next priority
    } else {
      console.log('🌐 [LoginPage] Using API URL from localStorage:', storedUrl);
      return storedUrl;
    }
  }

  // Priority 3: Check environment variable
  const envUrl = import.meta.env.VITE_BASE_URL || import.meta.env.REACT_APP_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    console.log('🌐 [LoginPage] Using API URL from environment:', envUrl);
    return envUrl;
  }

  // Priority 4: Check if it's a production domain (not localhost)
  // If hostname is not localhost and not a private IP, it's production
  const isProductionDomain =
    hostname !== 'localhost' &&
    hostname !== '127.0.0.1' &&
    !hostname.startsWith('192.168.') &&
    !hostname.startsWith('10.') &&
    !hostname.startsWith('172.') &&
    hostname !== '' &&
    !hostname.includes('.local');

  // If on production domain, use production API directly
  if (isProductionDomain) {
    const productionUrl = 'https://api.mazaadati.com/api';
    console.log('🌐 [LoginPage] Production domain detected - Using PRODUCTION API:', productionUrl);
    console.log('   Hostname:', hostname);
    return productionUrl;
  }

  // Priority 5: Check Vite development mode (only for localhost)
  const isViteDev = import.meta.env.MODE === 'development' ||
    import.meta.env.DEV ||
    import.meta.env.PROD === false;

  // Use local URL if in development mode (only on localhost)
  if (isViteDev || port === '3000' || port === '5173') {
    const localUrl = 'http://localhost:5000/api';
    console.log('🌐 [LoginPage] Development mode - Will try LOCAL API first:', localUrl);
    return localUrl;
  }

  // Fallback: Production API (when deployed to production domain)
  const productionUrl = 'https://api.mazaadati.com/api';
  console.log('🌐 [LoginPage] Fallback - Using PRODUCTION API:', productionUrl);
  return productionUrl;
}

// Get initial base URL (will try local first if on localhost)
let BASE_URL = getBaseUrl();

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
    'viewer': '',
    'employee': ''
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
      id: 'employee',
      label: 'Employee',
      subtitle: 'Manage company products only',
      icon: Briefcase,
      color: 'orange',
      phone: rolePhones.employee
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

      // Smart fallback: Try local first, then production if local fails
      let currentBaseUrl = BASE_URL;
      let isLocalUrl = currentBaseUrl.includes('localhost') || currentBaseUrl.includes('127.0.0.1');
      let triedProduction = false;

      // Try login with current URL (local or production)
      while (true) {
        console.log('🔐 [LoginPage] Attempting login to:', `${currentBaseUrl}/auth/admin-login`);
        console.log('   Phone:', normalizedPhone, 'Role:', selectedRole);
        if (triedProduction) {
          console.log('   🔄 Retrying with PRODUCTION API (local backend not available)');
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for faster fallback

        try {
          const response = await fetch(`${currentBaseUrl}/auth/admin-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: normalizedPhone,
              role: selectedRole
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          // Success! Process the response
          await processLoginResponse(response);
          return; // Exit successfully

        } catch (fetchError) {
          clearTimeout(timeoutId);

          // Check if it's a connection error
          const isConnectionError =
            fetchError.name === 'AbortError' ||
            (fetchError.message && (
              fetchError.message.includes('Failed to fetch') ||
              fetchError.message.includes('ERR_CONNECTION') ||
              fetchError.message.includes('timeout') ||
              fetchError.message.includes('NetworkError')
            ));

          // If local backend failed and we haven't tried production yet, fallback to production
          if (isConnectionError && isLocalUrl && !triedProduction) {
            console.warn('⚠️ [LoginPage] Local backend not accessible, trying production API...');
            const productionUrl = 'https://api.mazaadati.com/api';
            currentBaseUrl = productionUrl;
            isLocalUrl = false;
            triedProduction = true;
            // Save to localStorage so it persists on refresh
            localStorage.setItem('API_BASE_URL', productionUrl);
            console.log('✅ [LoginPage] Switched to PRODUCTION API and saved to localStorage');
            continue; // Retry with production URL
          }

          // If we already tried production or it's not a connection error, throw the error
          if (fetchError.name === 'AbortError') {
            throw new Error('Connection timeout. Please check your internet connection.');
          }
          if (isConnectionError) {
            throw new Error(`Cannot connect to API server. ${triedProduction ? 'Both local and production servers are unreachable.' : 'Please check your internet connection.'}`);
          }
          throw fetchError;
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process login response
  async function processLoginResponse(response) {
    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || `Server error (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.success && data.token) {
      // Extract role from response
      const role = data.role || data.user?.role;
      const normalizedRole = role?.toLowerCase();

      // Check if user has admin role (superadmin, admin, moderator, viewer, employee)
      const adminRoles = ['superadmin', 'admin', 'moderator', 'viewer', 'employee'];
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
      } else if (normalizedRole === 'employee') {
        window.location.hash = 'dashboard'; // Employee goes to dashboard (Products page)
      } else if (normalizedRole === 'viewer') {
        window.location.hash = 'viewer-dashboard';
      } else {
        window.location.hash = 'dashboard';
      }
    } else {
      throw new Error(data.message || 'Login failed');
    }
  }

  // Get role display name
  const getRoleDisplayName = () => {
    if (!selectedRole) return 'Admin';
    if (selectedRole === 'superadmin') return 'Super Admin';
    if (selectedRole === 'moderator') return 'Moderator';
    if (selectedRole === 'employee') return 'Employee';
    if (selectedRole === 'viewer') return 'Viewer';
    return 'Admin';
  };

  // Get role color class for title
  const getRoleColorClass = () => {
    if (!selectedRole) return 'text-gray-900 dark:text-white';
    if (selectedRole === 'superadmin') return 'text-blue-600 dark:text-blue-400';
    if (selectedRole === 'moderator') return 'text-purple-600 dark:text-purple-400';
    if (selectedRole === 'employee') return 'text-orange-600 dark:text-orange-400';
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
                  orange: isSelected
                    ? 'border-orange-600 bg-orange-50 dark:bg-orange-950'
                    : 'border-gray-200 dark:border-gray-800 hover:border-orange-300',
                  green: isSelected
                    ? 'border-green-600 bg-green-50 dark:bg-green-950'
                    : 'border-gray-200 dark:border-gray-800 hover:border-green-300'
                };
                const iconColorClasses = {
                  blue: isSelected ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                  purple: isSelected ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700',
                  orange: isSelected ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700',
                  green: isSelected ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                };
                const checkColorClasses = {
                  blue: 'bg-blue-600',
                  purple: 'bg-purple-600',
                  orange: 'bg-orange-600',
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
