# Email Authentication Fixes & Admin Approval System

## ✅ What Was Fixed

### 1. Removed All OTP Code
- ✅ Deleted `backend/src/services/otp.service.ts`
- ✅ Removed OTP table from database schema
- ✅ Removed all OTP references from codebase
- ✅ Cleaned up comments and unused code

### 2. Fixed Email Authentication
- ✅ Fixed duplicate email error handling
- ✅ Improved signup flow to prevent duplicate accounts
- ✅ Fixed login to properly check user approval status
- ✅ Better error messages for users

### 3. Added Admin Approval System
- ✅ New signups require admin approval before login
- ✅ Users can sign up but cannot login until approved
- ✅ Admin interface in Settings > Pending Approvals
- ✅ Approve/Reject functionality for admins
- ✅ Clear error messages when login is blocked

### 4. Database Schema Updates
- ✅ Added `approval_status` field (pending/approved/rejected)
- ✅ Added `approved_by` and `approved_at` fields
- ✅ Default `is_active = false` for new signups
- ✅ Email field is now required and unique

## 🚀 Next Steps

### Step 1: Run Database Migration

Go to **Supabase Dashboard > SQL Editor** and run:

```sql
-- Add approval system columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id);

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Make email NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'email'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE user_profiles
        ALTER COLUMN email SET NOT NULL;
    END IF;
END $$;

-- Mark existing active users as approved
UPDATE user_profiles
SET approval_status = 'approved', is_active = true
WHERE approval_status IS NULL AND is_active = true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status 
ON user_profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active 
ON user_profiles(is_active);
```

Or use the file: `backend/src/database/migrate_approval_system.sql`

### Step 2: Create Your First Admin User

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **Supabase Dashboard > Authentication > Users**
2. Create a new user or use existing user
3. Go to **Supabase Dashboard > Table Editor > user_profiles**
4. Find the user and update:
   - `role` = `'admin'`
   - `is_active` = `true`
   - `approval_status` = `'approved'`

**Option B: Via SQL Editor**

```sql
UPDATE user_profiles
SET 
  role = 'admin',
  is_active = true,
  approval_status = 'approved'
WHERE email = 'your-admin-email@example.com';
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

### Step 4: Test the Flow

1. **Signup Test**:
   - Go to http://localhost:5173
   - Click "Sign Up" tab
   - Create a new account
   - Should see: "Account created! Please wait for admin approval."

2. **Login Test (Before Approval)**:
   - Try to login with the new account
   - Should see: "Your account is pending admin approval."

3. **Admin Approval Test**:
   - Login as admin
   - Go to **Settings > Pending Approvals**
   - See the pending user
   - Click **Approve**

4. **Login Test (After Approval)**:
   - Login with the approved account
   - Should work successfully!

## 📋 How It Works

### User Signup Flow
1. User fills signup form (email, password, name)
2. Account created in Supabase Auth
3. Profile created with `is_active = false`, `approval_status = 'pending'`
4. User cannot login until approved

### Admin Approval Flow
1. Admin logs in (must have `role = 'admin'`)
2. Admin goes to **Settings > Pending Approvals**
3. Admin sees list of pending users
4. Admin clicks **Approve** or **Reject**
5. Approved users can now login

### Login Flow
1. User enters email/password
2. Supabase Auth verifies credentials
3. System checks:
   - If `is_active = false` OR `approval_status != 'approved'` → **BLOCKED**
   - If `is_active = true` AND `approval_status = 'approved'` → **ALLOWED**

## 🔒 Security Notes

1. **Admin Role**: Only assign admin role directly in Supabase database
2. **No Auto-Approval**: All new signups require manual approval
3. **Role-Based Access**: Only admins can approve/reject users
4. **Email Uniqueness**: Email must be unique (enforced by database)

## 🐛 Troubleshooting

### "Failed to create account" Error
- Check if email already exists in `auth.users` or `user_profiles`
- User should login instead of signing up
- Or admin can approve existing user

### "Account pending approval" but can't login
- Verify in `user_profiles` table:
  - `is_active` should be `true`
  - `approval_status` should be `'approved'`
- Admin needs to approve via Settings page

### Admin can't see pending users
- Verify admin's role: `SELECT role FROM user_profiles WHERE email = 'admin@example.com'`
- Should be `'admin'`
- Refresh the page after login

### Duplicate email error
- User already exists
- Check both `auth.users` and `user_profiles` tables
- User should login or contact admin

## 📁 Files Changed

### Backend
- `backend/src/routes/auth.routes.ts` - Updated signup/login with approval checks
- `backend/src/database/schema.sql` - Added approval fields, removed OTP table
- `backend/src/database/migrate_approval_system.sql` - New migration file
- `backend/src/services/otp.service.ts` - **DELETED**

### Frontend
- `frontend/src/lib/api.ts` - Added approval endpoints
- `frontend/src/store/auth.store.ts` - Updated signup/login logic
- `frontend/src/app/components/LoginPage.tsx` - Updated messages
- `frontend/src/app/modules/Settings.tsx` - Added Pending Approvals tab

## 📚 Documentation

- `ADMIN_APPROVAL_SETUP.md` - Detailed setup guide
- `REMOVED_OTP.md` - OTP removal documentation
- `EMAIL_AUTH_SETUP.md` - Email auth setup (if exists)
