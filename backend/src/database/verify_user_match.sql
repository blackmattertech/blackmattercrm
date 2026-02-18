-- Verify user IDs match between auth.users and user_profiles
-- Run this in Supabase SQL Editor

-- Get user from auth.users
SELECT 
  id as auth_id,
  email as auth_email,
  email_confirmed_at
FROM auth.users
WHERE email = 'info@blackmattertech.com';

-- Get user from user_profiles
SELECT 
  id as profile_id,
  email as profile_email,
  role,
  is_active,
  approval_status
FROM user_profiles
WHERE email = 'info@blackmattertech.com';

-- Check if IDs match (they should be the same)
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  au.email,
  CASE 
    WHEN au.id = up.id THEN '✅ IDs MATCH'
    ELSE '❌ IDs DO NOT MATCH - NEED TO FIX'
  END as status,
  up.role,
  up.is_active,
  up.approval_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.email = up.email
WHERE au.email = 'info@blackmattertech.com';

-- If IDs don't match, run this to fix:
-- UPDATE user_profiles
-- SET id = '0e6bbd59-a24a-4dd5-a5fa-979a971af083'
-- WHERE email = 'info@blackmattertech.com';
