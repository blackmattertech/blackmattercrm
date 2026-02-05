# Authentication Changes: Phone OTP → Email/Password

## ✅ Completed Changes

### Backend Changes
1. ✅ **Updated auth routes** (`backend/src/routes/auth.routes.ts`)
   - Removed: `POST /api/auth/send-otp`
   - Removed: `POST /api/auth/verify-otp`
   - Added: `POST /api/auth/signup` - Register with email/password
   - Added: `POST /api/auth/login` - Login with email/password
   - Updated: `POST /api/auth/logout` - Now uses Supabase signOut
   - Updated: `GET /api/auth/me` - Returns email-based user

2. ✅ **Removed OTP service dependency**
   - No longer imports `OTPService`
   - Uses Supabase Auth directly

3. ✅ **Updated auth middleware**
   - Uses Supabase anon client for token verification
   - Handles email-based users

4. ✅ **Updated database schema**
   - `user_profiles.email` - Added, unique
   - `user_profiles.phone` - Made optional (nullable)
   - `otp_codes.phone` - Made optional (for backward compatibility)

### Frontend Changes
1. ✅ **Updated LoginPage** (`frontend/src/app/components/LoginPage.tsx`)
   - Removed: Phone input and OTP verification
   - Added: Email and password inputs
   - Added: Login and Signup tabs
   - Updated: UI to match design system

2. ✅ **Updated auth store** (`frontend/src/store/auth.store.ts`)
   - Removed: `sendOTP()` and OTP-related methods
   - Added: `signup()` method
   - Updated: `login()` to use email/password

3. ✅ **Updated API client** (`frontend/src/lib/api.ts`)
   - Removed: `sendOTP()` and `verifyOTP()`
   - Added: `signup()` and `login()`

4. ✅ **Updated TopHeader**
   - Shows email instead of phone
   - User initials from email if no name

### Documentation
1. ✅ Created `EMAIL_AUTH_SETUP.md` - Complete setup guide
2. ✅ Created `EMAIL_AUTH_MIGRATION.md` - Database migration steps
3. ✅ Updated `README.md` - Reflects email auth
4. ✅ Updated `SETUP.md` - Updated setup instructions

## 🚀 Next Steps

### 1. Run Database Migration

Go to Supabase Dashboard > SQL Editor and run:

```sql
-- Add email column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Make phone optional
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'phone' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE user_profiles 
        ALTER COLUMN phone DROP NOT NULL;
    END IF;
END $$;

-- Remove unique constraint on phone
DROP INDEX IF EXISTS user_profiles_phone_key;

-- Add unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email) 
WHERE email IS NOT NULL;
```

### 2. Verify Email Provider in Supabase

1. Go to: https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/auth/providers
2. Verify **Email** provider is enabled (should be by default)
3. No additional configuration needed!

### 3. Test

1. **Restart backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test signup:**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Enter email, password, name
   - Create account

3. **Test login:**
   - Use email and password
   - Sign in

## ✨ Benefits

- ✅ **No external services** - Everything handled by Supabase
- ✅ **Completely free** - Supabase free tier includes email auth
- ✅ **More secure** - Industry-standard password hashing
- ✅ **Simpler** - No OTP codes, no SMS delays
- ✅ **Better UX** - Instant login, no waiting

## 📝 API Changes Summary

| Old Endpoint | New Endpoint | Change |
|-------------|--------------|--------|
| `POST /api/auth/send-otp` | ❌ Removed | Use signup/login instead |
| `POST /api/auth/verify-otp` | ❌ Removed | Use signup/login instead |
| - | `POST /api/auth/signup` | ✅ New - Register user |
| - | `POST /api/auth/login` | ✅ New - Login user |
| `POST /api/auth/logout` | `POST /api/auth/logout` | ✅ Updated |
| `GET /api/auth/me` | `GET /api/auth/me` | ✅ Updated |

## 🔄 Migration Notes

- Existing phone-based users can sign up again with email
- Phone field is kept for backward compatibility
- OTP codes table kept but not used
- All other modules work the same

---

**Everything is ready!** Just run the database migration and you're good to go! 🎉
