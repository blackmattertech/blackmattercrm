# Admin Approval System Setup

## Overview
The authentication system now requires admin approval for all new user signups. Users can create accounts, but they cannot login until an admin approves them.

## Database Migration

### Step 1: Run the Approval System Migration

Go to **Supabase Dashboard > SQL Editor** and run:

```sql
-- Add approval_status column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approved_by column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id);

-- Add approved_at column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Make email NOT NULL if it isn't already
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

-- Set default is_active to false for new signups
-- Existing users should remain active
UPDATE user_profiles
SET is_active = false, approval_status = 'pending'
WHERE approval_status IS NULL OR approval_status = 'pending';

-- For existing users without approval_status, mark them as approved
UPDATE user_profiles
SET approval_status = 'approved', is_active = true
WHERE approval_status IS NULL AND is_active = true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status 
ON user_profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active 
ON user_profiles(is_active);
```

Or use the migration file: `backend/src/database/migrate_approval_system.sql`

## Creating the First Admin User

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard > Authentication > Users**
2. Create a new user manually or use an existing user
3. Go to **Supabase Dashboard > Table Editor > user_profiles**
4. Find the user and update:
   - `role` = `'admin'`
   - `is_active` = `true`
   - `approval_status` = `'approved'`

### Option 2: Via SQL Editor

```sql
-- First, create the user in Supabase Auth (or use existing)
-- Then update their profile:
UPDATE user_profiles
SET 
  role = 'admin',
  is_active = true,
  approval_status = 'approved'
WHERE email = 'your-admin-email@example.com';
```

## How It Works

### User Signup Flow

1. User fills out signup form (email, password, full name)
2. Account is created in Supabase Auth
3. User profile is created with:
   - `is_active` = `false`
   - `approval_status` = `'pending'`
4. User receives message: "Account created. Please wait for admin approval."
5. User **cannot login** until approved

### Admin Approval Flow

1. Admin logs in (must have `role = 'admin'`)
2. Admin goes to **Settings > Pending Approvals** tab
3. Admin sees list of pending users
4. Admin clicks **Approve** or **Reject**
5. Approved users can now login

### Login Flow

1. User enters email and password
2. Supabase Auth verifies credentials
3. System checks user profile:
   - If `is_active = false` OR `approval_status != 'approved'` → **Login blocked**
   - If `is_active = true` AND `approval_status = 'approved'` → **Login allowed**

## API Endpoints

### For Users
- `POST /api/auth/signup` - Create account (requires approval)
- `POST /api/auth/login` - Login (only works if approved)

### For Admins
- `GET /api/auth/pending-users` - Get list of pending users
- `POST /api/auth/approve-user/:id` - Approve a user
- `POST /api/auth/reject-user/:id` - Reject a user
- `PUT /api/users/:id/role` - Update user role
- `PUT /api/users/:id/approve` - Alternative approve endpoint

## Frontend Features

### Login Page
- Shows clear message after signup: "Account created. Please wait for admin approval."
- Login shows error if user is not approved: "Your account is pending admin approval."

### Settings Page (Admin Only)
- **Pending Approvals** tab shows all pending users
- Badge shows count of pending users
- Approve/Reject buttons for each user
- User details: name, email, role, signup date

## Troubleshooting

### User can't login after signup
- Check `user_profiles` table:
  - `is_active` should be `true`
  - `approval_status` should be `'approved'`
- If not, admin needs to approve via Settings page

### Admin can't see pending users
- Verify admin's role in `user_profiles` table: `role = 'admin'`
- Check if user is logged in with admin account
- Refresh the page

### Duplicate email error
- User already exists in `auth.users` or `user_profiles`
- User should login instead of signing up
- Or admin can approve existing user

## Security Notes

1. **Admin Role Assignment**: Only assign admin role directly in Supabase database
2. **Approval Required**: All new signups require approval (no auto-approval)
3. **Role-Based Access**: Only admins can approve/reject users
4. **Email Uniqueness**: Email must be unique across all users

## Next Steps

1. Run the migration SQL
2. Create your first admin user
3. Test signup flow
4. Test approval flow
5. Test login after approval
