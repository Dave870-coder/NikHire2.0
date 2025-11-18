# 🚀 NikHire Full Stack Setup Complete!

## What's Ready

✅ **Backend Server** - Node.js + Express on Port 3000  
✅ **Frontend App** - HTML/CSS/JS on Port 8000  
✅ **Database** - MongoDB (auto-fallback to in-memory)  
✅ **Authentication** - JWT + Password Hashing  
✅ **API Integration** - Frontend talks to Backend  
✅ **Easy Launch** - Batch & PowerShell scripts included  

---

## 🎯 How to Launch (Pick ONE)

### Option 1: Windows Batch (Easiest)
```powershell
# Navigate to the folder
cd 'c:\Users\David\Documents\Octahire_App\NikHire'

# Double-click this file:
start-nikhire.bat
```
**Result:** Both servers start in separate windows automatically

---

### Option 2: PowerShell Script
```powershell
# Right-click PowerShell, select "Run as Administrator"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Navigate to folder and run:
cd 'c:\Users\David\Documents\Octahire_App\NikHire'
.\start-nikhire.ps1
```
**Result:** Clean interface with status messages

---

### Option 3: Manual (Two Terminal Windows)

**Terminal 1 - Backend:**
```powershell
cd 'c:\Users\David\Documents\Octahire_App\NikHire'
npm run server
```

**Terminal 2 - Frontend:**
```powershell
cd 'c:\Users\David\Documents\Octahire_App\NikHire'
npm run client
```

**Terminal 3 (Optional) - Both Together:**
```powershell
npm run dev
```

---

## 🌐 Access Points

| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | http://localhost:8000 | Web Application |
| **Backend API** | http://localhost:3000 | REST API |
| **API Jobs** | http://localhost:3000/api/jobs | Get all jobs |
| **API Register** | http://localhost:3000/api/auth/register | Create account |
| **API Login** | http://localhost:3000/api/auth/login | Login user |

---

## 📋 Features You Can Test

### Student Features
- ✅ Register and login
- ✅ View job listings
- ✅ Apply for jobs
- ✅ Track applications
- ✅ Update profile
- ✅ View assigned tasks

### Admin Features
- ✅ View all users
- ✅ Create job postings
- ✅ View all applications
- ✅ Assign tasks to students
- ✅ Manage institutions

---

## 🔑 Test Account Creation

1. Open http://localhost:8000
2. Click "Register"
3. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `John Doe`
4. Click "Register"
5. Dashboard loads automatically ✅

**To create admin account:**
- Register a student account
- In browser console: `localStorage.setItem('currentUser', JSON.stringify({...user, role: 'admin'}))`
- Refresh page

---

## 📁 File Structure

```
NikHire/
├── server.js                    ← Express backend (Port 3000)
├── index.html                   ← Main frontend
├── js/
│   ├── app.js                  ← Frontend app logic
│   └── api-client.js           ← Backend API calls
├── .env                         ← Configuration (PORT=3000)
├── package.json                 ← Dependencies
│
├── start-nikhire.bat           ← Windows launcher
├── start-nikhire.ps1           ← PowerShell launcher
├── QUICK_START.md              ← Detailed setup guide
├── README.md                    ← Main documentation
└── SETUP_COMPLETE.md           ← This file
```

---

## 🛠️ Troubleshooting

### "Port 3000 already in use"
Edit `.env`:
```
PORT=3001
```
Update `js/api-client.js`:
```javascript
constructor(baseURL = 'http://localhost:3001')
```

### "Cannot connect to backend"
- Ensure `npm run server` is running
- Check that no firewall blocks port 3000
- Open browser console (F12) and check errors

### "Database errors"
- Server automatically uses in-memory MongoDB
- No local MongoDB installation needed
- Data resets when server restarts

### "Clear all data"
In browser console:
```javascript
localStorage.clear()
location.reload()
```

---

## 🔄 What Happens Behind Scenes

1. **You launch script** → Installs npm packages if needed
2. **Backend starts** → Connects to MongoDB (or uses in-memory)
3. **Frontend starts** → Static HTTP server on port 8000
4. **Browser opens app** → Frontend requests jobs from backend
5. **You register** → Backend creates user in MongoDB + JWT token
6. **You apply for job** → Frontend sends request to backend API
7. **Backend validates** → Checks JWT token, saves to database
8. **Frontend updates** → Shows new application in dashboard

---

## 🎓 API Examples

### Login User
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get All Jobs
```bash
curl http://localhost:3000/api/jobs
```

### Get Current User (requires token)
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 Next Steps

1. **Run one of the launch methods above**
2. **Register a test account**
3. **Explore all features**
4. **Modify code and restart servers**
5. **Deploy to production** (future step)

---

## ✨ Key Technologies

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Database (in-memory for dev)
- **Mongoose** - Database modeling
- **JWT** - Secure authentication
- **Bcryptjs** - Password hashing
- **Tailwind CSS** - UI styling
- **Vanilla JavaScript** - Frontend logic

---

## 🚀 You're All Set!

Everything is configured and ready to run. Just execute one of the launch commands and start using NikHire!

**Questions?** Check QUICK_START.md or README.md

Happy coding! 💻

