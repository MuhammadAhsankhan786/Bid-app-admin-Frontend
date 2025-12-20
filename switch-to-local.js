/**
 * Quick script to switch Admin Panel to LOCAL backend
 * Run this in browser console (F12)
 */

// Method 1: Set local URL explicitly
localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api');
console.log('✅ Set API_BASE_URL to LOCAL: http://localhost:5000/api');
console.log('🔄 Reloading page...');
location.reload();

// OR Method 2: Remove localStorage to auto-detect localhost
// localStorage.removeItem('API_BASE_URL');
// console.log('✅ Removed API_BASE_URL - will auto-detect localhost');
// location.reload();

