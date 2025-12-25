# 🔧 Local Backend Use Karne Ke Liye

## ❌ Current Issue

Admin Panel **LIVE API** (`https://api.mazaadati.com/api`) use kar raha hai instead of **LOCAL** (`http://localhost:5000/api`)

Console me dikh raha hai:
```
[Admin Panel] Using API URL from localStorage: https://api.mazaadati.com/api
```

## ✅ Solution: Local Backend Use Karo

### Method 1: Browser Console Se (Easiest)

1. Admin Panel kholo (`localhost:3000`)
2. Browser Console open karo (F12)
3. Ye command run karo:

```javascript
localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api');
location.reload();
```

4. Page reload ho jayega aur ab **LOCAL** backend use hoga

### Method 2: localStorage Clear Karo

1. Browser Console open karo (F12)
2. Ye command run karo:

```javascript
localStorage.removeItem('API_BASE_URL');
location.reload();
```

3. Admin Panel automatically **localhost** detect karega aur local backend use karega

### Method 3: Settings Page Se

1. Admin Panel me **Settings** page par jao
2. API URL setting me `http://localhost:5000/api` set karo
3. Save karo

## ✅ Verification

Console me ye dikhna chahiye:
```
🌐 [Admin Panel] Localhost detected - Using LOCAL API: http://localhost:5000/api
```

Agar ye dikhe to **LOCAL** backend use ho raha hai ✅

## 📋 Checklist

- [ ] Local backend running hai (`localhost:5000`)
- [ ] Browser Console me localStorage command run ki
- [ ] Page reload kiya
- [ ] Console me "LOCAL API" message dikh raha hai
- [ ] Dashboard data load ho raha hai

---

**Note**: Agar phir bhi live API use ho raha hai, to browser cache clear karo ya incognito mode me try karo.

