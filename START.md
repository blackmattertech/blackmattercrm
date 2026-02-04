# 🚀 Start Both Services

## Quick Start (One Command)

From the project root:

```bash
cd /Users/mukeshayudh/Downloads/blackmattercrm
npm run dev
```

This will start:
- ✅ **Backend** on http://localhost:3001
- ✅ **Frontend** on http://localhost:5173

## What You'll See

```
[backend] 🚀 Server running on port 3001
[backend] 📊 Environment: development
[backend] Redis connected successfully
[frontend] VITE v6.x.x  ready in xxx ms
[frontend] ➜  Local:   http://localhost:5173/
```

## Stop Both Services

Press `Ctrl + C` in the terminal to stop both services.

## Individual Commands

If you prefer to run them separately:

### Terminal 1 - Backend:
```bash
cd /Users/mukeshayudh/Downloads/blackmattercrm/backend
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd /Users/mukeshayudh/Downloads/blackmattercrm/frontend
npm run dev
```

## First Time Setup

If you haven't installed dependencies yet:

```bash
# Install root dependencies (concurrently)
cd /Users/mukeshayudh/Downloads/blackmattercrm
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Now you can start both
cd ..
npm run dev
```

## Troubleshooting

### "concurrently: command not found"
- Run: `npm install` in the root directory
- This installs the `concurrently` package

### Port already in use
- Backend (3001): Change `PORT` in `backend/.env`
- Frontend (5173): Vite will auto-use next available port

### Services not starting
- Check you're in the correct directory
- Verify dependencies are installed: `npm install` in both folders
- Check `.env` files are configured

---

**That's it!** Just run `npm run dev` from the root directory! 🎉
