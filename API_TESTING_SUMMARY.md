# Admin Panel API Testing - Summary

## Kya Banaya Gaya Hai

Main ne admin panel ki saari APIs ko test karne ke liye ek complete testing system banaya hai jo:

1. **Local aur Live dono URLs par APIs test karta hai**
2. **Identify karta hai ke kaun si APIs local par kaam kar rahi hain lekin live par nahi**
3. **Detailed report generate karta hai**

## Files Created

1. **`test-admin-apis.js`** - Main testing script
2. **`README_API_TESTING.md`** - Detailed usage guide (English)
3. **`run-api-test.ps1`** - Windows PowerShell script (easy run ke liye)
4. **`run-api-test.bat`** - Windows Batch script (easy run ke liye)

## Kaise Use Karein

### Method 1: PowerShell Script (Easiest)

```powershell
cd "Bid app admin  Frontend"
.\run-api-test.ps1
```

Script automatically:
- Token mangta hai agar nahi mila
- Dependencies install karta hai agar nahi hain
- Tests run karta hai
- Report generate karta hai

### Method 2: Batch Script

```cmd
cd "Bid app admin  Frontend"
run-api-test.bat
```

### Method 3: Direct npm Command

```bash
cd "Bid app admin  Frontend"

# Token ke saath
$env:ADMIN_TOKEN="your-token-here"
npm run test:apis
```

## Admin Token Kaise Lagayein (Sabse Aasan Tarika) ⭐

### Method 1: Helper Script (Recommended)

**PowerShell:**
```powershell
.\set-token.ps1
```

**Ya Batch File:**
```cmd
set-token.bat
```

**Ya npm command:**
```powershell
npm run set-token
```

Script aap se token mangega. Browser se token copy karke paste karein. Token automatically save ho jayega!

### Method 2: Manual File

1. `Bid app admin  Frontend` folder mein `.admin_token` naam ki file banayein
2. Usmein apna admin token paste karein (sirf token, kuch aur nahi)
3. File save karein

### Token Browser Se Kaise Lein:

1. Admin panel mein login karein
2. Browser console kholen (F12)
3. Console mein ye command run karein:
   ```javascript
   localStorage.getItem('token')
   ```
4. Jo token dikhe, use copy karein

## Test Results

Test complete hone ke baad:

1. **Console Output**: Real-time results console mein dikhenge
2. **Report File**: `ADMIN_API_TEST_REPORT.md` file generate hogi jismein:
   - Kaun si APIs local par kaam kar rahi hain
   - Kaun si APIs live par kaam kar rahi hain
   - Kaun si APIs local par kaam karti hain lekin live par nahi (issues)

## APIs Tested

Total **50+ APIs** test ki jayengi:

- ✅ Dashboard APIs (3)
- ✅ User Management APIs (9)
- ✅ Product Management APIs (11)
- ✅ Order Management APIs (3)
- ✅ Analytics APIs (4)
- ✅ Auction APIs (3)
- ✅ Notification APIs (1)
- ✅ Payment APIs (1)
- ✅ Referral APIs (5)
- ✅ Wallet APIs (1)
- ✅ Seller Earnings APIs (1)
- ✅ Banner APIs (4)

## Report Format

Report mein ye information hogi:

- **Summary**: Total APIs, success rate, issues count
- **Critical Issues**: APIs jo local par kaam karti hain lekin live par nahi
- **Detailed Status**: Har API ka status table format mein

## Important Notes

1. **Authentication**: Zyadatar APIs ke liye valid admin token chahiye
2. **Local Backend**: Local tests ke liye backend `localhost:5000` par chalna chahiye
3. **Live Backend**: Live tests ke liye `https://api.mazaadati.com/api` accessible hona chahiye
4. **Timeout**: Har API test 10 seconds tak wait karega

## Next Steps

Jab test complete ho jaye:

1. Report file check karein (`ADMIN_API_TEST_REPORT.md`)
2. Issues section mein dekhein ke kaun si APIs fix karni hain
3. Live server par un APIs ko fix/deploy karein
4. Phir se test run karein to verify

## Troubleshooting

**Agar sab APIs fail ho rahi hain:**
- Admin token valid hai ya nahi check karein
- Backend server chal raha hai ya nahi check karein
- Network connectivity check karein

**Agar sirf live APIs fail ho rahi hain:**
- Live server status check karein
- CORS settings check karein
- Server logs check karein

## Example Output

```
🚀 Starting Admin Panel API Tests...

📡 Local URL: http://localhost:5000/api
🌐 Live URL: https://api.mazaadati.com/api

Testing 50 APIs...

📋 Testing: Get Dashboard
   GET /admin/dashboard
   🔵 Testing LOCAL...
   ✅ LOCAL: Success (200)
   🟢 Testing LIVE...
   ✅ LIVE: Success (200)

📋 Testing: Get Users
   GET /admin/users
   🔵 Testing LOCAL...
   ✅ LOCAL: Success (200)
   🟢 Testing LIVE...
   ❌ LIVE: Failed (401)
   ⚠️  ISSUE DETECTED: Works on LOCAL but NOT on LIVE!

========================================
📊 TEST SUMMARY REPORT
========================================

📈 Statistics:
   Local:  45/50 APIs working (90.0%)
   Live:   40/50 APIs working (80.0%)

⚠️  CRITICAL ISSUES FOUND: 5 APIs work on LOCAL but NOT on LIVE
```

---

**Created by:** Auto AI Assistant  
**Date:** 2024  
**Purpose:** Admin panel APIs ko local aur live dono par test karna

