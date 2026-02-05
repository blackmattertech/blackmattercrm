-- COMPLETE FIX FOR ADMIN LOGIN
-- Run this entire script in Supabase SQL Editor

-- Step 1: Verify user exists in auth.users
SELECT 
  'Step 1: Auth User Check' as step,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'info@blackmattertech.com';

-- Step 2: Delete any existing user_profiles entry (to start fresh)
DELETE FROM user_profiles WHERE email = 'info@blackmattertech.com';

-- Step 3: Create user_profiles entry with correct ID from auth.users
INSERT INTO user_profiles (id, email, role, is_active, approval_status, full_name)
SELECT 
  id,
  'info@blackmattertech.com',
  'admin',
  true,
  'approved',
  'Admin User'
FROM auth.users
WHERE email = 'info@blackmattertech.com';

-- Step 4: Verify everything is correct
SELECT 
  'Step 4: Final Verification' as step,
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
    WHEN up.is_active = true AND up.approval_status = 'approved' AND au.id = up.id THEN '✅ READY TO LOGIN'
    ELSE '❌ NOT READY'
  END as login_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'info@blackmattertech.com';
