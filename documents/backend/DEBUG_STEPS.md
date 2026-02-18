# Debug Steps - Login Not Working

## What I've Added

1. **Backend Logging**: Added request logging to see all incoming requests
2. **Frontend Console Logging**: Added console.log statements to track the login flow
3. **Better Error Handling**: Improved error messages

## Next Steps

### 1. Restart Backend
The backend needs to restart to pick up the new logging. Stop it (Ctrl+C) and restart:
```bash
cd backend
npm run dev
```

### 2. Open Browser Console
1. Open your app: http://localhost:5173
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to the **Console** tab
4. Try to login

### 3. Check What You See

**In Browser Console**, you should see:
- `[Auth Store] Attempting login for: info@blackmattertech.com`
- `[Auth Store] Login response: { ... }`
- Either success or error messages

**In Backend Terminal**, you should see:
- `POST /api/auth/login` with the request body
- `Login attempt received: { email: '...' }`
- `Login attempt for: ...`
- Either success or error logs

### 4. Common Issues to Check

**If you see nothing in browser console:**
- The login button might not be calling the function
- Check the Network tab in DevTools to see if the request is being made

**If you see "Network error":**
- Backend might not be running
- CORS issue
- Wrong API URL

**If you see "Invalid email or password":**
- Password is wrong
- User doesn't exist in auth.users
- Check Supabase Dashboard > Authentication > Users

**If you see "User profile not found":**
- Run `complete_fix.sql` in Supabase SQL Editor

### 5. Test Directly

You can also test the endpoint directly:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info@blackmattertech.com","password":"YOUR_PASSWORD"}'
```

Replace `YOUR_PASSWORD` with your actual password.

## What to Share

After trying to login, share:
1. **Browser Console output** - What do you see?
2. **Backend Terminal output** - What logs appear?
3. **Network tab** - In DevTools, go to Network tab, try login, and check the `/api/auth/login` request. What's the status code and response?

This will help me pinpoint exactly where it's failing!
