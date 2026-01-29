# 🚨 VPS Band Hone Ke Baad Local Setup

## Problem Kya Thi

Client ne apna VPS band kar diya tha, isliye production API (`https://api.mazaadati.com/api`) accessible nahi thi. Is wajah se connection timeout error aa raha tha.

## ✅ Solution: Local Backend Use Karein

Ab aapko local backend chala ke admin panel use karna hoga.

---

## 📋 Step-by-Step Setup

### Step 1: Backend Server Start Karein

**Terminal/PowerShell me yeh commands run karein:**

```bash
cd "Bid app Backend"
npm start
```

**Expected Output:**
```
🚀 Server running on port 5000
```

✅ Backend ab `http://localhost:5000` par chal raha hai.

---

### Step 2: Frontend Server Start Karein

**Naya terminal window kholo aur yeh commands run karein:**

```bash
cd "Bid app admin  Frontend"
npm run dev
```

**Expected Output:**
```
  VITE v6.3.5  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

✅ Frontend ab `http://localhost:3000` par chal raha hai.

---

### Step 3: Admin Panel Open Karein

1. Browser me `http://localhost:3000` open karein
2. **Automatically local backend use hoga** (code me fix kar diya hai)
3. Browser console (F12) me yeh message dikhna chahiye:
   ```
   🌐 [LoginPage] Localhost detected - Using LOCAL API: http://localhost:5000/api
   ```

---

### Step 4: Login Karein

1. **Role select karein** (Super Admin, Moderator, Employee, ya Viewer)
2. **Phone number enter karein** (Iraq format: +964XXXXXXXXXX)
3. **Login button click karein**

✅ Ab login successfully ho jayega!

---

## 🔍 Verification

### Backend Check Karein

Browser me yeh URL open karein:
```
http://localhost:5000/api/health
```

Agar backend chal raha hai, to response aayega.

### Frontend Check Karein

Browser console (F12) me yeh messages dikhne chahiye:
```
🌐 [LoginPage] Localhost detected - Using LOCAL API: http://localhost:5000/api
```

---

## ⚠️ Important Notes

### 1. Database Connection

Backend ko database se connect karne ke liye `.env` file me `DATABASE_URL` set hona chahiye:

```env
DATABASE_URL=postgresql://username:password@host:port/database
```

### 2. Environment Variables

Backend folder me `.env` file check karein:
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT token secret
- `PORT` - Server port (default: 5000)

### 3. Dependencies

Pehle dependencies install karein (agar nahi kiye):

```bash
cd "Bid app Backend"
npm install

cd "../Bid app admin  Frontend"
npm install
```

---

## 🆘 Troubleshooting

### Problem 1: Backend Start Nahi Ho Raha

**Check karein:**
- Port 5000 already use ho raha hai?
- `.env` file me `DATABASE_URL` set hai?
- Node.js version 18+ hai?

**Solution:**
```bash
# Port check karein
netstat -ano | findstr :5000

# Ya different port use karein
# .env me PORT=5001 set karein
```

### Problem 2: Frontend Still Production URL Use Kar Raha Hai

**Solution:**
Browser console (F12) me yeh command run karein:
```javascript
localStorage.setItem('API_BASE_URL', 'http://localhost:5000/api');
location.reload();
```

### Problem 3: Database Connection Error

**Check karein:**
- Database server running hai?
- `DATABASE_URL` correct hai?
- Database credentials valid hain?

**Solution:**
`.env` file me `DATABASE_URL` verify karein aur correct karein.

---

## 📝 Quick Commands Summary

```bash
# Backend start
cd "Bid app Backend"
npm start

# Frontend start (naya terminal)
cd "Bid app admin  Frontend"
npm run dev

# Browser me open karein
# http://localhost:3000
```

---

## ✅ Success Checklist

- [ ] Backend server running hai (`localhost:5000`)
- [ ] Frontend server running hai (`localhost:3000`)
- [ ] Browser console me "LOCAL API" message dikh raha hai
- [ ] Login successfully ho raha hai
- [ ] Dashboard load ho raha hai

---

## 🎯 Next Steps

1. **Local development:** Ab local backend use karke development kar sakte hain
2. **VPS setup:** Jab VPS wapas start hoga, to production URL use kar sakte hain
3. **Auto-detect:** Code automatically localhost detect karega, manual setup ki zarurat nahi

---

**Note:** Jab VPS wapas start hoga, to production URL automatically use hoga (agar localhost se access nahi kar rahe).



