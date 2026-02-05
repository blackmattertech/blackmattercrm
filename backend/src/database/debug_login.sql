-- Debug Login Issues
-- Run this to check everything is set up correctly

-- 1. Check if user exists in auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'info@blackmattertech.com';

-- 2. Check if user exists in user_profiles
SELECT 
  'user_profiles' as table_name,
  id,
  email,
  role,
  is_active,
  approval_status,
  created_at
FROM user_profiles
WHERE email = 'info@blackmattertech.com';

-- 3. Check if IDs match (CRITICAL - they must match!)
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  au.email,
  CASE 
    WHEN au.id = up.id THEN '✅ IDs MATCH - Good!'
    WHEN up.id IS NULL THEN '❌ NO PROFILE - Need to create user_profiles'
    ELSE '❌ IDs DO NOT MATCH - Need to fix!'
  END as status,
  up.role,
  up.is_active,
  up.approval_status,
  CASE 
    WHEN up.is_active = true AND up.approval_status = 'approved' THEN '✅ READY TO LOGIN'
    WHEN up.is_active = false THEN '❌ is_active = false'
    WHEN up.approval_status != 'approved' THEN '❌ approval_status != approved'
    WHEN up.id IS NULL THEN '❌ NO PROFILE'
    ELSE '❌ NOT READY'
  END as login_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'info@blackmattertech.com';

-- 4. If profile doesn't exist, create it (replace AUTH_ID with the id from step 1)
-- INSERT INTO user_profiles (id, email, role, is_active, approval_status, full_name)
-- VALUES (
--   'AUTH_ID_FROM_STEP_1',
--   'info@blackmattertech.com',
--   'admin',
--   true,
--   'approved',
--   'Admin User'
-- );
