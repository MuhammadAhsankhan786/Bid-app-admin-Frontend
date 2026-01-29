# 🔧 API Connection Error Fix

## ❌ Problem
Getting `ERR_CONNECTION_TIMED_OUT` error when trying to login:
```
Failed to load resource: net::ERR_CONNECTION_TIMED_OUT
api.mazaadati.com/api/auth/admin-login:1
Login error: TypeError: Failed to fetch
```

## ✅ Solution Applied

### 1. Fixed LoginPage.jsx API URL Detection
- Updated `getBaseUrl()` function to match `api.js` logic
- Now properly checks:
  1. **Localhost detection** (priority 1) - Always uses `http://localhost:5000/api` on localhost
  2. **localStorage override** (priority 2) - Can manually set API URL
  3. **Environment variable** (priority 3) - Uses `VITE_BASE_URL` if set
  4. **Development mode** (priority 4) - Uses local URL in dev mode
  5. **Production** (fallback) - Uses `https://api.mazaadati.com/api`

### 2. Improved Error Handling
- Added 30-second timeout for API requests
- Better error messages showing current API URL
- Clear instructions on how to change API URL

## 🔍 Troubleshooting Steps

### Step 1: Check Which API URL is Being Used

Open browser console (F12) and look for:
```
🌐 [LoginPage] Localhost detected - Using LOCAL API: http://localhost:5000/api
```
OR
```
🌐 [LoginPage] Production mode - Using PRODUCTION API: https://api.mazaadati.com/api
```

### Step 2: If Using Production API But Backend is Local

**Option A: Clear localStorage (Auto-detect localhost)**
```javascript
localStorage.removeItem('API_BASE_URL');
location.reload();
```

**Option B: Manually Set Local URL**
```javascript
localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api');
location.reload();
```

### Step 3: If Using Local API But Backend is on Production

**Set Production URL:**
```javascript
localStorage.setItem('API_BASE_URL', 'https://api.mazaadati.com/api');
location.reload();
```

### Step 4: Verify Backend is Running

**For Local Backend:**
- Check if backend is running on `http://localhost:5000`
- Test in browser: `http://localhost:5000/api/health` (if health endpoint exists)
- Check backend terminal for errors

**For Production Backend:**
- Test in browser: `https://api.mazaadati.com/api/health`
- Check if domain is accessible
- Verify SSL certificate is valid

## 🎯 Quick Fix Commands

### Use Local Backend (localhost:5000)
```javascript
localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api');
location.reload();
```

### Use Production Backend
```javascript
localStorage.setItem('API_BASE_URL', 'https://api.mazaadati.com/api');
location.reload();
```

### Reset to Auto-Detect
```javascript
localStorage.removeItem('API_BASE_URL');
location.reload();
```

## 📋 Common Issues

### Issue 1: "ERR_CONNECTION_TIMED_OUT"
**Cause:** Cannot reach API server
**Solution:**
- Check if backend server is running
- Check firewall/network settings
- Verify API URL is correct
- Try ping/curl to API URL

### Issue 2: "404 Not Found"
**Cause:** API endpoint doesn't exist
**Solution:**
- Verify endpoint path: `/api/auth/admin-login`
- Check backend routes configuration
- Ensure backend is running latest code

### Issue 3: "CORS Error"
**Cause:** Backend not allowing frontend origin
**Solution:**
- Check backend CORS configuration
- Add frontend URL to allowed origins
- For local: Allow `http://localhost:3000`

## 🔄 Testing the Fix

1. **Open Admin Panel:** `http://localhost:3000`
2. **Open Browser Console:** Press F12
3. **Check API URL:** Look for `🌐 [LoginPage]` message
4. **Try Login:** Enter phone number and role
5. **Check Network Tab:** Verify request goes to correct URL

## 📝 Notes

- **Localhost Detection:** If accessing from `localhost` or `127.0.0.1`, it will ALWAYS use local API (`http://localhost:5000/api`)
- **localStorage Override:** Only works when NOT on localhost (for security)
- **Production Mode:** Only used when deployed to production domain
- **Timeout:** API requests now have 30-second timeout

## 🆘 Still Having Issues?

1. Check browser console for detailed error messages
2. Check Network tab in DevTools to see actual request/response
3. Verify backend is running and accessible
4. Check backend logs for errors
5. Try clearing browser cache and localStorage

---

**Last Updated:** After fixing LoginPage.jsx API URL detection and error handling

