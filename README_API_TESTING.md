# Admin Panel API Testing Guide

Yeh script admin panel ki saari APIs ko test karta hai aur identify karta hai ke kaun si APIs local par kaam kar rahi hain lekin live par nahi.

## Kaise Use Karein

### Step 1: Admin Token Lein

1. Admin panel mein login karein (browser mein)
2. Browser console kholen (F12)
3. Ye command run karein:
   ```javascript
   localStorage.getItem('token')
   ```
4. Token copy karein

### Step 2: Test Run Karein

**Option 1: Environment Variable ke saath (Recommended)**
```bash
# Windows PowerShell
$env:ADMIN_TOKEN="your-token-here"; npm run test:apis

# Windows CMD
set ADMIN_TOKEN=your-token-here && npm run test:apis

# Linux/Mac
ADMIN_TOKEN="your-token-here" npm run test:apis
```

**Option 2: Script mein directly token add karein**
- `test-admin-apis.js` file kholen
- Line 15 par `TEST_TOKEN` variable mein apna token paste karein

### Step 3: Results Dekhein

Test complete hone ke baad:
- Console mein detailed results dikhenge
- `ADMIN_API_TEST_REPORT.md` file generate hogi jismein:
  - Kaun si APIs local par kaam kar rahi hain
  - Kaun si APIs live par kaam kar rahi hain
  - Kaun si APIs local par kaam karti hain lekin live par nahi (issues)

## Report Format

Report mein ye information hogi:
- ✅ **Working APIs**: Dono local aur live par kaam kar rahi hain
- ⚠️ **Local Only**: Sirf local par kaam kar rahi hain (live par fix karna hai)
- ❌ **Failed APIs**: Dono par fail ho rahi hain

## Important Notes

1. **Authentication Required**: Zyadatar APIs ke liye admin token chahiye
2. **Test IDs**: Kuch APIs ko test ID chahiye (jaise `/admin/users/:id`). Script automatically `1` use karega, lekin agar aapke paas valid IDs hain to script update kar sakte hain
3. **Network Issues**: Agar local backend nahi chal raha to local tests fail ho sakte hain
4. **Timeout**: Har API test 10 seconds tak wait karega

## Troubleshooting

**Agar sab APIs fail ho rahi hain:**
- Check karein ke admin token valid hai
- Check karein ke backend server chal raha hai (local ke liye)
- Check karein ke live URL sahi hai

**Agar sirf live APIs fail ho rahi hain:**
- Live server check karein
- CORS issues check karein
- Network connectivity check karein

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

⚠️  ISSUE DETECTED: Works on LOCAL but NOT on LIVE!
```

