/**
 * Admin Panel API Testing Script
 * Tests all admin panel APIs on both local and live URLs
 * Identifies which APIs work on local but not on live
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

// API URLs
const LOCAL_URL = 'http://localhost:5000/api';
const LIVE_URL = 'https://api.mazaadati.com/api';

// Test token - will be set by getToken function
let TEST_TOKEN = '';

// Function to get token from various sources
async function getToken() {
  // Priority 1: Environment variable
  if (process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN.trim() !== '') {
    TEST_TOKEN = process.env.ADMIN_TOKEN.trim();
    console.log('✅ Token found in environment variable (ADMIN_TOKEN)');
    return TEST_TOKEN;
  }
  
  // Priority 2: Check for token file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const tokenFilePath = path.join(__dirname, '.admin_token');
  
  if (fs.existsSync(tokenFilePath)) {
    try {
      const tokenFromFile = fs.readFileSync(tokenFilePath, 'utf8').trim();
      if (tokenFromFile && tokenFromFile !== '') {
        TEST_TOKEN = tokenFromFile;
        console.log('✅ Token found in .admin_token file');
        return TEST_TOKEN;
      }
    } catch (error) {
      console.warn('⚠️  Could not read token file:', error.message);
    }
  }
  
  // Priority 3: Interactive input
  console.log('\n⚠️  No admin token found!');
  console.log('\nTo get your admin token:');
  console.log('1. Login to admin panel in browser');
  console.log('2. Open browser console (F12)');
  console.log('3. Run: localStorage.getItem("token")');
  console.log('4. Copy the token\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter your admin token (or press Enter to skip): ', (answer) => {
      if (answer && answer.trim() !== '') {
        TEST_TOKEN = answer.trim();
        // Ask if user wants to save
        rl.question('Save token to .admin_token file for future use? (y/n): ', (saveAnswer) => {
          rl.close();
          if (saveAnswer.toLowerCase() === 'y' || saveAnswer.toLowerCase() === 'yes') {
            try {
              fs.writeFileSync(tokenFilePath, TEST_TOKEN, 'utf8');
              console.log('✅ Token saved to .admin_token file');
            } catch (error) {
              console.warn('⚠️  Could not save token file:', error.message);
            }
          }
          resolve(TEST_TOKEN);
        });
      } else {
        rl.close();
        console.warn('⚠️  No token provided. Tests will run but most APIs will fail with 401.');
        resolve('');
      }
    });
  });
}

// All admin panel APIs from api.js
const ADMIN_APIS = [
  // Dashboard
  { method: 'GET', endpoint: '/admin/dashboard', name: 'Get Dashboard', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/dashboard/charts', name: 'Get Dashboard Charts', params: { period: 'week' }, requiresAuth: true },
  { method: 'GET', endpoint: '/admin/dashboard/categories', name: 'Get Dashboard Categories', requiresAuth: true },
  
  // Users
  { method: 'GET', endpoint: '/admin/users', name: 'Get Users', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/users/:id', name: 'Get User By ID', requiresAuth: true, needsId: true },
  { method: 'POST', endpoint: '/admin/users', name: 'Create User', requiresAuth: true, needsBody: true },
  { method: 'PUT', endpoint: '/admin/users/:id', name: 'Update User', requiresAuth: true, needsId: true, needsBody: true },
  { method: 'PUT', endpoint: '/admin/users/:id/role', name: 'Update User Role', requiresAuth: true, needsId: true, needsBody: true },
  { method: 'DELETE', endpoint: '/admin/users/:id', name: 'Delete User', requiresAuth: true, needsId: true },
  { method: 'PATCH', endpoint: '/admin/users/approve/:id', name: 'Approve User', requiresAuth: true, needsId: true },
  { method: 'PATCH', endpoint: '/admin/users/block/:id', name: 'Block User', requiresAuth: true, needsId: true },
  
  // Products
  { method: 'GET', endpoint: '/admin/products', name: 'Get Products', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/products/pending', name: 'Get Pending Products', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/products/live', name: 'Get Live Auctions', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/products/rejected', name: 'Get Rejected Products', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/products/completed', name: 'Get Completed Products', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/products/:id', name: 'Get Product By ID', requiresAuth: true, needsId: true },
  { method: 'GET', endpoint: '/admin/products/:id/documents', name: 'Get Product Documents', requiresAuth: true, needsId: true },
  { method: 'PATCH', endpoint: '/admin/products/approve/:id', name: 'Approve Product', requiresAuth: true, needsId: true, needsBody: true },
  { method: 'PATCH', endpoint: '/admin/products/reject/:id', name: 'Reject Product', requiresAuth: true, needsId: true, needsBody: true },
  { method: 'PUT', endpoint: '/admin/products/:id', name: 'Update Product', requiresAuth: true, needsId: true, needsBody: true },
  { method: 'DELETE', endpoint: '/admin/products/:id', name: 'Delete Product', requiresAuth: true, needsId: true },
  
  // Orders
  { method: 'GET', endpoint: '/admin/orders', name: 'Get Orders', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/orders/stats', name: 'Get Order Stats', requiresAuth: true },
  { method: 'PATCH', endpoint: '/admin/orders/:id/status', name: 'Update Order Status', requiresAuth: true, needsId: true, needsBody: true },
  
  // Analytics
  { method: 'GET', endpoint: '/admin/analytics/weekly', name: 'Get Weekly Analytics', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/analytics/monthly', name: 'Get Monthly Analytics', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/analytics/categories', name: 'Get Category Analytics', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/analytics/top-products', name: 'Get Top Products', requiresAuth: true },
  
  // Auctions
  { method: 'GET', endpoint: '/admin/auctions/active', name: 'Get Active Auctions', requiresAuth: true },
  { method: 'GET', endpoint: '/admin/auctions/:id/bids', name: 'Get Auction Bids', requiresAuth: true, needsId: true },
  { method: 'GET', endpoint: '/admin/auction/:id/winner', name: 'Get Auction Winner', requiresAuth: true, needsId: true },
  
  // Notifications
  { method: 'GET', endpoint: '/admin/notifications', name: 'Get Notifications', requiresAuth: true },
  
  // Payments
  { method: 'GET', endpoint: '/admin/payments', name: 'Get Payments', requiresAuth: true },
  
  // Referrals
  { method: 'GET', endpoint: '/admin/referrals', name: 'Get Referrals', requiresAuth: true },
  { method: 'PUT', endpoint: '/admin/referrals/:id/revoke', name: 'Revoke Referral', requiresAuth: true, needsId: true },
  { method: 'PUT', endpoint: '/admin/users/:id/adjust-reward', name: 'Adjust User Reward', requiresAuth: true, needsId: true, needsBody: true },
  { method: 'GET', endpoint: '/admin/referral/settings', name: 'Get Referral Settings', requiresAuth: true },
  { method: 'PUT', endpoint: '/admin/referral/settings', name: 'Update Referral Settings', requiresAuth: true, needsBody: true },
  
  // Wallet
  { method: 'GET', endpoint: '/admin/wallet/logs', name: 'Get Wallet Logs', requiresAuth: true },
  
  // Seller Earnings
  { method: 'GET', endpoint: '/admin/seller/:id/earnings', name: 'Get Seller Earnings', requiresAuth: true, needsId: true },
  
  // Banners
  { method: 'GET', endpoint: '/banners', name: 'Get Banners', requiresAuth: false },
  { method: 'POST', endpoint: '/banners', name: 'Create Banner', requiresAuth: true, needsBody: true },
  { method: 'PUT', endpoint: '/banners/:id', name: 'Update Banner', requiresAuth: true, needsId: true, needsBody: true },
  { method: 'DELETE', endpoint: '/banners/:id', name: 'Delete Banner', requiresAuth: true, needsId: true },
];

// Test results storage
const results = {
  local: {},
  live: {},
  issues: []
};

// Helper function to make API request
async function testApi(baseUrl, api, testId = '1') {
  let url = api.endpoint;
  
  // Replace :id with test ID
  if (api.needsId && url.includes(':id')) {
    url = url.replace(':id', testId);
  }
  
  const fullUrl = `${baseUrl}${url}`;
  
  const config = {
    method: api.method,
    url: fullUrl,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
  };
  
  // Add auth token if required
  if (api.requiresAuth && TEST_TOKEN) {
    config.headers.Authorization = `Bearer ${TEST_TOKEN}`;
  }
  
  // Add query params
  if (api.params) {
    config.params = api.params;
  }
  
  // Add body for POST/PUT/PATCH
  if ((api.method === 'POST' || api.method === 'PUT' || api.method === 'PATCH') && api.needsBody) {
    config.data = api.testData || {};
  }
  
  try {
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'NETWORK_ERROR',
      data: null,
      error: error.response?.data || error.message
    };
  }
}

// Test all APIs
async function testAllApis() {
  console.log('🚀 Starting Admin Panel API Tests...\n');
  console.log(`📡 Local URL: ${LOCAL_URL}`);
  console.log(`🌐 Live URL: ${LIVE_URL}\n`);
  
  // Get token before starting tests
  await getToken();
  
  if (!TEST_TOKEN) {
    console.warn('\n⚠️  WARNING: No admin token provided. Most APIs will fail with 401.');
    console.warn('   You can set ADMIN_TOKEN environment variable or create .admin_token file.\n');
  } else {
    console.log(`\n✅ Using token: ${TEST_TOKEN.substring(0, 20)}...${TEST_TOKEN.substring(TEST_TOKEN.length - 10)}\n`);
  }
  
  console.log(`Testing ${ADMIN_APIS.length} APIs...\n`);
  console.log('='.repeat(80));
  
  for (const api of ADMIN_APIS) {
    console.log(`\n📋 Testing: ${api.name}`);
    console.log(`   ${api.method} ${api.endpoint}`);
    
    // Test on local
    console.log('   🔵 Testing LOCAL...');
    const localResult = await testApi(LOCAL_URL, api);
    results.local[api.endpoint] = localResult;
    
    if (localResult.success) {
      console.log(`   ✅ LOCAL: Success (${localResult.status})`);
    } else {
      console.log(`   ❌ LOCAL: Failed (${localResult.status})`);
      if (localResult.error) {
        console.log(`      Error: ${typeof localResult.error === 'object' ? JSON.stringify(localResult.error).substring(0, 100) : localResult.error}`);
      }
    }
    
    // Test on live
    console.log('   🟢 Testing LIVE...');
    const liveResult = await testApi(LIVE_URL, api);
    results.live[api.endpoint] = liveResult;
    
    if (liveResult.success) {
      console.log(`   ✅ LIVE: Success (${liveResult.status})`);
    } else {
      console.log(`   ❌ LIVE: Failed (${liveResult.status})`);
      if (liveResult.error) {
        console.log(`      Error: ${typeof liveResult.error === 'object' ? JSON.stringify(liveResult.error).substring(0, 100) : liveResult.error}`);
      }
    }
    
    // Check for issues
    if (localResult.success && !liveResult.success) {
      results.issues.push({
        api: api.name,
        endpoint: api.endpoint,
        method: api.method,
        localStatus: localResult.status,
        liveStatus: liveResult.status,
        liveError: liveResult.error
      });
      console.log(`   ⚠️  ISSUE DETECTED: Works on LOCAL but NOT on LIVE!`);
    } else if (!localResult.success && liveResult.success) {
      console.log(`   ℹ️  Note: Works on LIVE but NOT on LOCAL (may be expected)`);
    }
    
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Generate report
  await generateReport();
}

// Generate detailed report
async function generateReport() {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(80));
  
  const localSuccess = Object.values(results.local).filter(r => r.success).length;
  const localTotal = Object.keys(results.local).length;
  const liveSuccess = Object.values(results.live).filter(r => r.success).length;
  const liveTotal = Object.keys(results.live).length;
  
  console.log(`\n📈 Statistics:`);
  console.log(`   Local:  ${localSuccess}/${localTotal} APIs working (${((localSuccess/localTotal)*100).toFixed(1)}%)`);
  console.log(`   Live:   ${liveSuccess}/${liveTotal} APIs working (${((liveSuccess/liveTotal)*100).toFixed(1)}%)`);
  
  if (results.issues.length > 0) {
    console.log(`\n⚠️  CRITICAL ISSUES FOUND: ${results.issues.length} APIs work on LOCAL but NOT on LIVE\n`);
    console.log('='.repeat(80));
    console.log('🔴 APIs THAT NEED TO BE FIXED ON LIVE:');
    console.log('='.repeat(80));
    
    results.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.api}`);
      console.log(`   Endpoint: ${issue.method} ${issue.endpoint}`);
      console.log(`   Local Status: ${issue.localStatus} ✅`);
      console.log(`   Live Status: ${issue.liveStatus} ❌`);
      if (issue.liveError) {
        const errorMsg = typeof issue.liveError === 'object' 
          ? JSON.stringify(issue.liveError).substring(0, 200)
          : issue.liveError;
        console.log(`   Error: ${errorMsg}`);
      }
    });
  } else {
    console.log(`\n✅ No issues found! All APIs that work on LOCAL also work on LIVE.`);
  }
  
  // Detailed comparison
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('📋 DETAILED API STATUS COMPARISON');
  console.log('='.repeat(80));
  
  ADMIN_APIS.forEach(api => {
    const local = results.local[api.endpoint];
    const live = results.live[api.endpoint];
    
    const localStatus = local?.success ? '✅' : '❌';
    const liveStatus = live?.success ? '✅' : '❌';
    
    console.log(`\n${api.name}`);
    console.log(`   ${api.method} ${api.endpoint}`);
    console.log(`   Local: ${localStatus} (${local?.status || 'N/A'}) | Live: ${liveStatus} (${live?.status || 'N/A'})`);
  });
  
  // Save report to file
  const reportContent = generateReportFile();
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const reportPath = path.join(__dirname, 'ADMIN_API_TEST_REPORT.md');
    
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error('⚠️  Could not save report file:', error.message);
    console.log('\n📄 Report content:\n');
    console.log(reportContent);
  }
}

// Generate markdown report file
function generateReportFile() {
  const timestamp = new Date().toISOString();
  let report = `# Admin Panel API Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `**Local URL:** ${LOCAL_URL}\n`;
  report += `**Live URL:** ${LIVE_URL}\n\n`;
  
  const localSuccess = Object.values(results.local).filter(r => r.success).length;
  const localTotal = Object.keys(results.local).length;
  const liveSuccess = Object.values(results.live).filter(r => r.success).length;
  const liveTotal = Object.keys(results.live).length;
  
  report += `## Summary\n\n`;
  report += `- **Local APIs Working:** ${localSuccess}/${localTotal} (${((localSuccess/localTotal)*100).toFixed(1)}%)\n`;
  report += `- **Live APIs Working:** ${liveSuccess}/${liveTotal} (${((liveSuccess/liveTotal)*100).toFixed(1)}%)\n`;
  report += `- **Issues Found:** ${results.issues.length}\n\n`;
  
  if (results.issues.length > 0) {
    report += `## ⚠️ Critical Issues\n\n`;
    report += `The following APIs work on LOCAL but NOT on LIVE:\n\n`;
    
    results.issues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.api}\n\n`;
      report += `- **Endpoint:** \`${issue.method} ${issue.endpoint}\`\n`;
      report += `- **Local Status:** ✅ ${issue.localStatus}\n`;
      report += `- **Live Status:** ❌ ${issue.liveStatus}\n`;
      if (issue.liveError) {
        const errorMsg = typeof issue.liveError === 'object' 
          ? JSON.stringify(issue.liveError, null, 2)
          : issue.liveError;
        report += `- **Error:** \`\`\`json\n${errorMsg}\n\`\`\`\n`;
      }
      report += `\n`;
    });
  }
  
  report += `## Detailed API Status\n\n`;
  report += `| API Name | Method | Endpoint | Local | Live | Status |\n`;
  report += `|----------|--------|----------|-------|------|--------|\n`;
  
  ADMIN_APIS.forEach(api => {
    const local = results.local[api.endpoint];
    const live = results.live[api.endpoint];
    
    const localStatus = local?.success ? '✅' : '❌';
    const liveStatus = live?.success ? '✅' : '❌';
    const status = local?.success && live?.success ? '✅ Both' 
                  : local?.success && !live?.success ? '⚠️ Local Only'
                  : !local?.success && live?.success ? 'ℹ️ Live Only'
                  : '❌ Both Failed';
    
    report += `| ${api.name} | ${api.method} | ${api.endpoint} | ${localStatus} | ${liveStatus} | ${status} |\n`;
  });
  
  return report;
}

// Run tests
testAllApis().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

