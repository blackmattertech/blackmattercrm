# Mobile Login Debugging Guide

## Changes Made

1. **Dynamic API URL Detection**: The API URL now automatically detects the current hostname and uses it for API calls
   - On laptop (localhost): Uses `http://localhost:3001/api`
   - On mobile (network IP): Uses `http://192.168.1.39:3001/api` (or your network IP)

2. **Enhanced Error Logging**: Added comprehensive console logging to help diagnose issues
3. **Increased Timeout**: Extended API timeout to 15 seconds for mobile connections
4. **Better Error Messages**: More descriptive error messages to help identify the issue

## How to Debug

### Step 1: Check Console Logs

On your mobile device, open the browser's developer console (if available) or check the laptop console. You should see:

```
[API] Detected hostname: 192.168.1.39
[API] Using API URL: http://192.168.1.39:3001/api
[API] Full window.location: {...}
[Auth Store] Attempting login for: your-email@example.com
[API Request] { method: 'POST', url: 'http://192.168.1.39:3001/api/auth/login', ... }
```

### Step 2: Verify Backend is Accessible

From your mobile device, try accessing the backend health endpoint directly:
```
http://192.168.1.39:3001/health
```

You should see: `{"status":"ok","timestamp":"..."}`

If this doesn't work, the backend is not accessible from your mobile device.

### Step 3: Check Network Connection

1. **Same Network**: Ensure both laptop and mobile are on the same Wi-Fi network
2. **Firewall**: Check if your laptop's firewall is blocking port 3001
3. **Backend Listening**: Verify backend is listening on `0.0.0.0` (all interfaces)

### Step 4: Test from Mobile Browser

1. Open mobile browser
2. Go to: `http://192.168.1.39:5173` (or your frontend port)
3. Open browser console (if available) or check network tab
4. Try to login
5. Check for errors in console

### Step 5: Common Issues

#### Issue: "Failed to fetch" or "Network error"
- **Cause**: Backend not accessible from mobile
- **Solution**: 
  - Check firewall settings
  - Verify backend is running: `npm run dev` in backend folder
  - Check backend logs for incoming requests

#### Issue: "CORS error"
- **Cause**: Backend CORS not allowing mobile origin
- **Solution**: Backend should already allow all local network IPs, but check `backend/src/index.ts` CORS configuration

#### Issue: "Request timeout"
- **Cause**: Slow network or backend not responding
- **Solution**: 
  - Check backend is running
  - Check network speed
  - Verify backend logs show the request arriving

#### Issue: "Invalid email or password" (but works on laptop)
- **Cause**: API URL might still be using localhost
- **Solution**: 
  - Clear browser cache
  - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
  - Check console logs to verify API URL

## Manual API URL Override

If automatic detection doesn't work, you can manually set the API URL:

1. Create/Edit `frontend/.env`:
```env
VITE_API_URL=http://192.168.1.39:3001/api
```

2. Replace `192.168.1.39` with your actual laptop's network IP

3. Restart the frontend dev server

## Finding Your Network IP

On Mac/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

On Windows:
```bash
ipconfig
```

Look for the IP address in the `192.168.x.x` or `10.x.x.x` range.

## Testing Backend Accessibility

From mobile device, try:
```bash
# If you have terminal access on mobile
curl http://192.168.1.39:3001/health
```

Or use a mobile browser to visit:
```
http://192.168.1.39:3001/health
```

## Next Steps

1. Check the console logs on mobile (if possible) or laptop
2. Verify backend health endpoint is accessible from mobile
3. Check backend logs when attempting login from mobile
4. Share the error messages you see

The enhanced logging should now show exactly what's happening during the login attempt.
