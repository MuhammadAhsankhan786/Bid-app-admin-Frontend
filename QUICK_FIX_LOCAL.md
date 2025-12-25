# ⚡ QUICK FIX: Local Backend Use Karo

## 🔴 Current Problem

Console me dikh raha hai:
```
🌐 [Admin Panel] Using API URL from localStorage: https://api.mazaadati.com/api
```

**Matlab**: Admin Panel **LIVE API** use kar raha hai, **LOCAL** nahi.

## ✅ Solution (2 Steps)

### Step 1: Console Open Karo

1. Admin Panel me **F12** press karo
2. Ya **Right Click** → **Inspect** → **Console** tab

### Step 2: Ye Command Copy-Paste Karo

Console me ye **exact command** type karo aur **Enter** press karo:

```javascript
localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api'); location.reload();
```

**Ya phir do alag commands:**

```javascript
localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api');
```

Phir:

```javascript
location.reload();
```

## ✅ Verification

Command run karne ke baad:

1. Page automatically reload hoga
2. Console me ye dikhna chahiye:
   ```
   🌐 [Admin Panel] Using API URL from localStorage: http://localhost:5000/api
   ```
3. Dashboard data load ho jayega ✅

## 🔍 Agar Phir Bhi Live URL Dikhe

**localStorage Clear Karo:**

```javascript
localStorage.removeItem('API_BASE_URL');
location.reload();
```

Ye karne se admin panel automatically **localhost** detect karega.

---

**Note**: Ye command sirf ek baar run karni hai. Baad me automatically local backend use hoga jab tak aap localStorage clear nahi karte.

