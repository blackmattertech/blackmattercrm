# Troubleshooting Login Issues

## Step-by-Step Debugging

### 1. Run Complete Fix SQL
Run `complete_fix.sql` in Supabase SQL Editor - this will:
- Verify user exists in auth.users
- Delete old profile
- Create new profile with correct ID
- Verify everything matches

### 2. Check Backend Environment Variables
Make sure your `.env` file in `backend/` has:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Check Backend Logs
When you try to login, check your backend terminal. You should see:
- Either: `Login error: { message: '...', status: ... }`
- Or: `Profile fetch error: ...`

### 4. Verify Password
The password must match what you set in Supabase Dashboard.
- Go to Supabase Dashboard > Authentication > Users
- Find your user
- Click the three dots > "Reset Password" if needed

### 5. Test with Direct SQL
Run this to verify the user can be found:
```sql
-- Check everything
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  au.email,
  au.email_confirmed_at,
  up.role,
  up.is_active,
  up.approval_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'info@blackmattertech.com';
```

All should show:
- ✅ IDs match
- ✅ email_confirmed_at is NOT NULL
- ✅ role = 'admin'
- ✅ is_active = true
- ✅ approval_status = 'approved'

## Common Issues

### Issue 1: "Invalid email or password"
- **Cause**: Wrong password or user doesn't exist
- **Fix**: Reset password in Supabase Dashboard

### Issue 2: "User profile not found"
- **Cause**: user_profiles entry doesn't exist or ID doesn't match
- **Fix**: Run `complete_fix.sql`

### Issue 3: "Account pending approval"
- **Cause**: is_active = false or approval_status != 'approved'
- **Fix**: Run the UPDATE in `complete_fix.sql`

### Issue 4: Environment variables not set
- **Cause**: SUPABASE_ANON_KEY missing or wrong
- **Fix**: Check `.env` file in backend folder

## Quick Test

After running `complete_fix.sql`, try logging in:
- Email: `info@blackmattertech.com`
- Password: (the password you set in Supabase Dashboard)

If it still fails, check the backend terminal for the exact error message.
