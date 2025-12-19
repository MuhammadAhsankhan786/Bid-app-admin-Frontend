# Admin Token Setup Guide (Urdu/Hindi)

## Token Kaise Lagayein

### Method 1: Helper Script (Sabse Aasan) ⭐

**Step 1:** PowerShell ya CMD mein ye command run karein:
```powershell
npm run set-token
```

Ya phir:
```cmd
set-token.bat
```

**Step 2:** Script aap se token mangega. Browser se token copy karke paste karein.

**Step 3:** Token automatically save ho jayega. Ab test run karein:
```powershell
npm run test:apis
```

---

### Method 2: Manual File Create

**Step 1:** `Bid app admin  Frontend` folder mein `.admin_token` naam ki file banayein

**Step 2:** Us file mein apna admin token paste karein (kuch aur mat likhein, sirf token)

**Step 3:** File save karein

**Step 4:** Ab test run karein:
```powershell
npm run test:apis
```

---

### Method 3: Environment Variable

**PowerShell:**
```powershell
$env:ADMIN_TOKEN="your-token-here"
npm run test:apis
```

**CMD:**
```cmd
set ADMIN_TOKEN=your-token-here
npm run test:apis
```

---

## Token Kaise Lein (Browser Se)

1. **Admin Panel Kholen** - Browser mein admin panel open karein
2. **Login Karein** - Apne credentials se login karein
3. **Console Kholen** - `F12` press karein ya Right-click > Inspect
4. **Console Tab** - Console tab select karein
5. **Command Run Karein** - Ye command type karein:
   ```javascript
   localStorage.getItem('token')
   ```
6. **Token Copy Karein** - Jo token dikhe, use copy karein (quotes ke saath nahi)

---

## Example

Agar token hai: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

To `.admin_token` file mein sirf ye likhein:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Ya phir `npm run set-token` run karke paste karein.

---

## Troubleshooting

**Agar token nahi mil raha:**
- Check karein ke aap admin panel mein logged in hain
- Browser console properly open hai
- Command sahi type kiya hai

**Agar token invalid hai:**
- Token expire ho sakta hai, phir se login karein
- Token ko properly copy karein (spaces nahi hone chahiye)

**Agar file save nahi ho rahi:**
- Check karein ke aapke paas write permissions hain
- File name exactly `.admin_token` honi chahiye (dot ke saath)

---

**Note:** Token file (`.admin_token`) git mein commit nahi hogi, kyunki wo `.gitignore` mein add hai.

