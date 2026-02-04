# 🚀 Quick Start Guide

## Current Directory Structure

Your project is located at:
```
/Users/mukeshayudh/Downloads/blackmattercrm/
```

## 📍 Navigation Commands

### From Anywhere:
```bash
cd /Users/mukeshayudh/Downloads/blackmattercrm
```

### From Home Directory:
```bash
cd ~/Downloads/blackmattercrm
```

### Check Current Location:
```bash
pwd
```

## 🏃 Quick Commands

### Start Backend
```bash
cd /Users/mukeshayudh/Downloads/blackmattercrm/backend
npm run dev
```

### Start Frontend (in new terminal)
```bash
cd /Users/mukeshayudh/Downloads/blackmattercrm/frontend
npm run dev
```

### Start Both (from root)
```bash
cd /Users/mukeshayudh/Downloads/blackmattercrm
npm run dev
```

## ✅ Setup Checklist

1. **Database Setup** (IMPORTANT - Do this first!)
   - Go to: https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/sql/new
   - Copy entire `backend/src/database/schema.sql` file
   - Paste and Run in SQL Editor
   - Verify tables created in Table Editor

2. **Environment Variables**
   - ✅ Backend `.env` - Already created
   - ✅ Frontend `.env` - Already created
   - Update Supabase credentials in `backend/.env`

3. **Install Dependencies**
   ```bash
   # Backend
   cd /Users/mukeshayudh/Downloads/blackmattercrm/backend
   npm install
   
   # Frontend
   cd /Users/mukeshayudh/Downloads/blackmattercrm/frontend
   npm install
   ```

4. **Start Services**
   ```bash
   # Terminal 1 - Backend
   cd /Users/mukeshayudh/Downloads/blackmattercrm/backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd /Users/mukeshayudh/Downloads/blackmattercrm/frontend
   npm run dev
   ```

5. **Test**
   - Open: http://localhost:5173
   - Sign up with email/password
   - Login and explore!

## 🐛 Common Issues

### "Table not found" Error
- **Fix:** Run `backend/src/database/schema.sql` in Supabase SQL Editor
- See: [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### "Cannot find module" Error
- **Fix:** Run `npm install` in backend and frontend folders

### Port already in use
- **Fix:** Change PORT in `backend/.env` or kill process using port

### Redis connection error
- **Fix:** Start Redis: `brew services start redis` (macOS)
- Or use Redis Cloud

## 📂 Project Structure

```
/Users/mukeshayudh/Downloads/blackmattercrm/
├── backend/          # Node.js API server
├── frontend/          # React application
├── package.json       # Root scripts
└── [docs]             # Documentation files
```

## 🔗 Important Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq
- **SQL Editor:** https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/sql/new
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

---

**Need help?** Check the other .md files in the root directory!
