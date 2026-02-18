# Create Admin User from Scratch

Since you've deleted both the auth user and profile, here's how to create everything from scratch.

## Method 1: Via Supabase Dashboard (Easiest)

### Step 1: Create User in Supabase Auth
1. Go to **Supabase Dashboard > Authentication > Users**
2. Click **"Add User"** or **"Invite User"**
3. Fill in:
   - **Email**: `info@blackmattertech.com`
   - **Password**: (choose a strong password)
   - **Auto Confirm User**: ✅ **Check this box** (important!)
4. Click **"Create User"**
5. **Copy the User ID** that appears (it will be a UUID like `0e6bbd59-a24a-4dd5-a5fa-979a971af083`)

### Step 2: Create User Profile
Run this SQL in **Supabase SQL Editor**, replacing `YOUR_AUTH_USER_ID_HERE` with the ID you copied:

```sql
-- Get the user ID first (if you forgot to copy it)
SELECT id, email FROM auth.users WHERE email = 'info@blackmattertech.com';

-- Create the user_profiles entry with the correct ID
INSERT INTO user_profiles (id, email, role, is_active, approval_status, full_name)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',  -- Paste the ID from auth.users here
  'info@blackmattertech.com',
  'admin',
  true,
  'approved',
  'Admin User'
);

-- Verify it worked
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  au.email,
  CASE 
    WHEN au.id = up.id THEN '✅ IDs MATCH'
    ELSE '❌ IDs DO NOT MATCH'
  END as id_status,
  up.role,
  up.is_active,
  up.approval_status,
  CASE 
    WHEN up.is_active = true AND up.approval_status = 'approved' THEN '✅ READY TO LOGIN'
    ELSE '❌ NOT READY'
  END as login_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'info@blackmattertech.com';
```

## Method 2: Via Your App's Signup (Alternative)

### Step 1: Use Signup Form
1. Go to your app: http://localhost:5173
2. Click **"Sign Up"** tab
3. Enter:
   - **Email**: `info@blackmattertech.com`
   - **Password**: (your desired password)
   - **Full Name**: Admin User
4. Click **"Sign Up"**

### Step 2: Make User Admin
After signup, the user will be created in both `auth.users` and `user_profiles`, but with `role = 'sales'` and `approval_status = 'pending'`.

Run this SQL to make them admin:

```sql
-- Get the user ID
SELECT id, email FROM auth.users WHERE email = 'info@blackmattertech.com';

-- Update to admin (replace USER_ID with the ID from above)
UPDATE user_profiles
SET 
  role = 'admin',
  is_active = true,
  approval_status = 'approved',
  full_name = 'Admin User'
WHERE email = 'info@blackmattertech.com';

-- Verify
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  au.email,
  up.role,
  up.is_active,
  up.approval_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'info@blackmattertech.com';
```

## Quick All-in-One Script

If you want to do it all in one go (after creating user in Dashboard):

```sql
-- Step 1: Get the auth user ID
DO $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Get the user ID
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'info@blackmattertech.com';
  
  -- Create user_profiles entry
  INSERT INTO user_profiles (id, email, role, is_active, approval_status, full_name)
  VALUES (
    auth_user_id,
    'info@blackmattertech.com',
    'admin',
    true,
    'approved',
    'Admin User'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'admin',
    is_active = true,
    approval_status = 'approved';
    
  RAISE NOTICE 'User profile created with ID: %', auth_user_id;
END $$;

-- Verify
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  au.email,
  up.role,
  up.is_active,
  up.approval_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'info@blackmattertech.com';
```

## After Setup

1. ✅ User exists in `auth.users`
2. ✅ User exists in `user_profiles` with matching ID
3. ✅ `role = 'admin'`
4. ✅ `is_active = true`
5. ✅ `approval_status = 'approved'`

**Now try logging in:**
- Email: `info@blackmattertech.com`
- Password: (the password you set)

It should work! 🎉
