# Environment Variables Setup Guide

This guide will help you set up all required environment variables for the BlackMatter ERP system.

## Quick Setup

1. **Copy the example files to create your .env files:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

2. **Update the values in each .env file** (see details below)

## Backend Environment Variables

Location: `backend/.env`

### Required Variables

#### Supabase Configuration
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```
**How to get:**
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL → `SUPABASE_URL`
4. Copy the `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
5. Copy the `anon` key → `SUPABASE_ANON_KEY`

#### Redis Configuration
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```
**For local development:** Use the defaults above if Redis is running locally.

**For Redis Cloud:**
```env
REDIS_URL=redis://username:password@host:port
```

#### JWT Secret
```env
JWT_SECRET=your_strong_random_string_here
```
**How to generate:**
```bash
openssl rand -base64 32
```
⚠️ **Important:** Use a strong, random string in production!

### Optional Variables

#### Phone OTP Configuration
**Note:** Phone OTP is now handled by Supabase Auth. No additional environment variables needed!

**Setup:**
1. Go to Supabase Dashboard > Authentication > Providers > Phone
2. Enable Phone provider
3. Configure SMS provider (Twilio, MessageBird, Vonage, or custom)
4. See [SUPABASE_PHONE_AUTH.md](./SUPABASE_PHONE_AUTH.md) for detailed setup

**For Development:**
- If SMS provider not configured, OTPs will be logged to console
- Use the OTP code shown in backend logs

#### Server Configuration
```env
PORT=3001
NODE_ENV=development
```
These defaults work for development. Adjust `PORT` if 3001 is already in use.

#### Application URLs
```env
APP_URL=http://localhost:5173
API_URL=http://localhost:3001
```
Update these for production deployment.

## Frontend Environment Variables

Location: `frontend/.env`

### Required Variables

#### API URL
```env
VITE_API_URL=http://localhost:3001/api
```
**For development:** Use `http://localhost:3001/api`

**For production:** Update to your production API URL
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Optional Variables

```env
VITE_APP_NAME=BlackMatter ERP
VITE_APP_VERSION=1.0.0
```

## Environment-Specific Files

### Frontend

You can create environment-specific files:

- `frontend/.env.development` - For development
- `frontend/.env.production` - For production builds
- `frontend/.env.local` - For local overrides (gitignored)

Vite will automatically load the appropriate file based on the mode.

## Verification

### Backend
After setting up `backend/.env`, start the backend:
```bash
cd backend
npm run dev
```

You should see:
- ✅ Server running on port 3001
- ✅ Redis connected successfully
- ❌ If Supabase connection fails, check your credentials

### Frontend
After setting up `frontend/.env`, start the frontend:
```bash
cd frontend
npm run dev
```

The frontend should connect to the backend API at the configured URL.

## Security Notes

1. **Never commit .env files to git** - They're already in .gitignore
2. **Use different secrets for production** - Don't reuse development secrets
3. **Rotate secrets regularly** - Especially JWT_SECRET and Supabase keys
4. **Use environment variables in CI/CD** - Don't hardcode secrets
5. **Restrict Supabase service_role key** - This key has admin access

## Troubleshooting

### Backend can't connect to Supabase
- Verify `SUPABASE_URL` is correct (should end with `.supabase.co`)
- Check that `SUPABASE_SERVICE_ROLE_KEY` is the service_role key, not anon key
- Ensure your Supabase project is active

### Backend can't connect to Redis
- Check Redis is running: `redis-cli ping` should return `PONG`
- Verify `REDIS_HOST` and `REDIS_PORT` match your Redis instance
- For Redis Cloud, use `REDIS_URL` instead

### Frontend can't connect to backend
- Verify `VITE_API_URL` matches your backend URL
- Check backend is running on the configured port
- Look for CORS errors in browser console

### OTP not working
- Check Supabase Dashboard > Authentication > Providers > Phone is enabled
- Verify SMS provider is configured in Supabase
- If not configured, check backend console for OTP codes (development mode)
- Verify phone number format (automatically formatted to E.164: +91XXXXXXXXXX)
- Check SMS provider balance/credits in provider dashboard
- See [SUPABASE_PHONE_AUTH.md](./SUPABASE_PHONE_AUTH.md) for troubleshooting

## Production Checklist

Before deploying to production:

- [ ] Generate new `JWT_SECRET` using `openssl rand -base64 32`
- [ ] Update `NODE_ENV=production`
- [ ] Set production `APP_URL` and `API_URL`
- [ ] Configure production Redis instance
- [ ] Set up Twilio for SMS OTP
- [ ] Review and restrict Supabase RLS policies
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use environment variables in deployment platform

## Example .env Files

### Minimal Backend .env (Development)
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev_secret_change_in_production
APP_URL=http://localhost:5173
API_URL=http://localhost:3001
```

### Minimal Frontend .env (Development)
```env
VITE_API_URL=http://localhost:3001/api
```

---

For more details, see [SETUP.md](./SETUP.md) and [DEPENDENCY.md](./DEPENDENCY.md)
