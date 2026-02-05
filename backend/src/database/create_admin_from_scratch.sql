-- Create Admin User from Scratch
-- IMPORTANT: You must create the user in Supabase Auth FIRST (see instructions below)
-- Then run this SQL to create the user_profiles entry

-- ============================================
-- METHOD 1: Create via Supabase Dashboard (Recommended)
-- ============================================
-- Step 1: Go to Supabase Dashboard > Authentication > Users
-- Step 2: Click "Add User" or "Invite User"
-- Step 3: Enter:
--   - Email: info@blackmattertech.com
--   - Password: (your desired password)
--   - Auto Confirm User: ✅ (check this box)
-- Step 4: Click "Create User"
-- Step 5: Copy the User ID that gets created
-- Step 6: Replace 'YOUR_AUTH_USER_ID_HERE' below with that ID
-- Step 7: Run the INSERT statement below

-- ============================================
-- METHOD 2: Use Signup Endpoint (Alternative)
-- ============================================
-- Use your app's signup form or API:
-- POST /api/auth/signup
-- {
--   "email": "info@blackmattertech.com",
--   "password": "your-password",
--   "full_name": "Admin User"
-- }
-- Then run the UPDATE statement below to make them admin

-- ============================================
-- SQL: Create user_profiles entry
-- ============================================

-- Option A: If you created user via Dashboard, use this:
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the actual ID from auth.users
INSERT INTO user_profiles (id, email, role, is_active, approval_status, full_name)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',  -- Get this from auth.users after creating the user
  'info@blackmattertech.com',
  'admin',
  true,
  'approved',
  'Admin User'
);

-- Option B: If you used signup endpoint, the profile was created but needs to be updated:
-- First, get the user ID
SELECT id, email FROM auth.users WHERE email = 'info@blackmattertech.com';

-- Then update the profile (replace 'USER_ID_FROM_ABOVE' with the ID)
UPDATE user_profiles
SET 
  role = 'admin',
  is_active = true,
  approval_status = 'approved',
  full_name = 'Admin User'
WHERE id = 'USER_ID_FROM_ABOVE';

-- ============================================
-- Verify the setup
-- ============================================
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
