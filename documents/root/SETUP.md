# Quick Setup Guide

Follow these steps to get the BlackMatter ERP system up and running.

## Step 1: Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

## Step 2: Set Up Supabase

1. Go to https://supabase.com and create an account
2. Create a new project
3. Wait for the project to be ready (takes ~2 minutes)
4. Go to Settings > API and copy:
   - Project URL
   - `service_role` key (keep this secret!)
   - `anon` key
5. Go to SQL Editor
6. Copy the entire contents of `backend/src/database/schema.sql`
7. Paste and run it in the SQL Editor
8. Verify tables are created in Table Editor

## Step 3: Set Up Redis

### Option A: Local Redis (Recommended for Development)

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Windows:**
- Download Redis from https://github.com/microsoftarchive/redis/releases
- Or use WSL2 with Linux instructions

### Option B: Redis Cloud (Free Tier)

1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Copy connection details

## Step 4: Enable Email Auth in Supabase

1. Go to Supabase Dashboard > Authentication > Providers
2. Find **Email** provider (should be enabled by default)
3. Verify it's enabled - no additional configuration needed!
4. **Note:** Email auth is completely free and requires no external services

## Step 5: Configure Environment Variables

### Backend

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=change_this_to_a_random_string_in_production
JWT_EXPIRES_IN=7d

OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

APP_NAME=BlackMatter ERP
APP_URL=http://localhost:5173
API_URL=http://localhost:3001

# Note: Email/Password auth is handled by Supabase Auth
# No additional configuration needed - email provider is enabled by default
```

### Frontend

Create `.env` in `frontend/` directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## Step 6: Verify Setup

### Check Redis
```bash
redis-cli ping
# Should return: PONG
```

### Check Supabase
- Go to Supabase Dashboard
- Check that tables are created in Table Editor
- Verify API keys are correct

## Step 7: Run the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 3001
📊 Environment: development
Redis connected successfully
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Step 8: Test Authentication

1. Open http://localhost:5173
2. Click "Sign Up" tab
3. Enter your email, password (min 6 chars), and name
4. Click "Create Account"
5. You should be automatically logged in and redirected to the dashboard
6. Or use "Login" tab to sign in with existing account

## Troubleshooting

### Backend won't start
- Check that all environment variables are set
- Verify Supabase URL and keys are correct
- Ensure Redis is running: `redis-cli ping`

### Frontend can't connect to backend
- Check that backend is running on port 3001
- Verify `VITE_API_URL` in `frontend/.env` matches backend URL
- Check browser console for CORS errors

### Login/Signup issues
- Verify email format is correct
- Check password is at least 6 characters
- Verify Email provider is enabled in Supabase Dashboard
- Check Supabase logs: Dashboard > Logs > Auth

### Database errors
- Verify schema.sql was executed completely
- Check Supabase logs in Dashboard
- Ensure RLS policies are set correctly

### Redis connection errors
- Verify Redis is running: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT in `.env`
- For Redis Cloud, use the full connection URL

## Next Steps

- Create your first lead in the CRM module
- Set up user roles in Settings
- Configure your chart of accounts
- Add team members

## Need Help?

- Check [DEPENDENCY.md](./DEPENDENCY.md) for detailed dependency setup
- Review [README.md](./README.md) for full documentation
- Check backend logs for detailed error messages
- Verify all environment variables are set correctly
