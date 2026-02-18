# Authentication Persistence & Remember Me

This document explains how authentication persistence and "Remember Me" functionality works in the application.

## Features

### 1. Token Persistence
- **Remember Me OFF**: Token stored in `sessionStorage` (cleared on browser close)
- **Remember Me ON**: Token stored in `localStorage` (persists across sessions)
- Token is always also stored in `localStorage` for API client access

### 2. User Data Caching
- User profile cached in `localStorage` with TTL:
  - **Remember Me OFF**: 5 minutes cache
  - **Remember Me ON**: 30 minutes cache
- Background verification updates cache without blocking UI

### 3. Offline Support
- If API fails but cached user exists, app continues to work
- Cached user data used as fallback for offline scenarios

## Storage Strategy

### Storage Keys
```typescript
STORAGE_KEYS = {
  TOKEN: 'auth_token',           // Always in localStorage for API client
  USER: 'auth_user',              // In localStorage or sessionStorage based on rememberMe
  REMEMBER_ME: 'auth_remember_me', // Preference flag
  CACHED_USER: 'cached_user',     // Cached user data
  CACHED_TIME: 'cached_user_time' // Cache timestamp
}
```

### Storage Selection
- **Remember Me = true**: Uses `localStorage` (persistent)
- **Remember Me = false**: Uses `sessionStorage` (temporary)

## Initialization Flow

1. **On App Mount**:
   - `initialize()` function runs
   - Loads token and user from appropriate storage
   - Restores auth state immediately (no flash)
   - Verifies token in background

2. **On Refresh**:
   - Token loaded from storage
   - User data restored from cache
   - Background verification updates if needed
   - No logout on refresh

## Login Flow

1. User enters credentials and checks "Remember Me"
2. Login API call succeeds
3. Token and user stored in:
   - `localStorage` (always, for API client)
   - `localStorage` or `sessionStorage` (based on rememberMe)
4. User data cached with appropriate TTL
5. Auth state updated

## Logout Flow

1. Logout API call (if possible)
2. Clear all storage:
   - `localStorage` (all keys)
   - `sessionStorage` (all keys)
3. Reset auth state
4. Redirect to login

## Caching Strategy

### User Profile Cache
- **TTL**: 5 minutes (normal) or 30 minutes (remember me)
- **Location**: `localStorage`
- **Update**: Background verification every time cache is used
- **Invalidation**: On logout, profile update, or cache expiry

### API Response Cache
- Backend uses Redis for user data (5 minute TTL)
- Frontend uses localStorage for offline support
- Cache invalidation on user updates

## Performance Optimizations

1. **Immediate State Restoration**: No loading flash on refresh
2. **Background Verification**: Token verified without blocking UI
3. **Smart Caching**: Different TTLs based on remember me preference
4. **Offline Support**: Cached data used when API unavailable

## Security Considerations

1. **Token Storage**: 
   - Tokens stored in browser storage (vulnerable to XSS)
   - Use HTTPS in production
   - Consider httpOnly cookies for production

2. **Remember Me**:
   - Longer cache TTL increases risk
   - Users should log out on shared devices
   - Consider session timeout for remember me sessions

3. **Token Validation**:
   - Always verified on app load
   - Background verification keeps data fresh
   - Invalid tokens trigger logout

## Troubleshooting

### User Logged Out on Refresh
- Check if token exists in storage
- Verify `initialize()` is called on mount
- Check browser console for errors
- Verify API client loads token correctly

### Remember Me Not Working
- Check if checkbox state is saved
- Verify storage preference is stored
- Check if token is in correct storage (localStorage vs sessionStorage)

### Slow Initial Load
- Check network tab for API calls
- Verify caching is working
- Check if background verification is blocking

## Best Practices

1. **Always use `initialize()` on app mount**
2. **Don't call `checkAuth()` directly - use `initialize()`**
3. **Store rememberMe preference with token**
4. **Clear all storage on logout**
5. **Use appropriate TTL based on rememberMe**
