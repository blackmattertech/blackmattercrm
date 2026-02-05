-- Fix duplicate email issue - user_profiles exists but with wrong ID
-- Run this in Supabase SQL Editor

-- Step 1: Check current state
SELECT 
  'auth.users' as source,
  id,
  email,
  NULL as role,
  NULL as is_active,
  NULL as approval_status
FROM auth.users
WHERE email = 'info@blackmattertech.com'

UNION ALL

SELECT 
  'user_profiles' as source,
  id,
  email,
  role,
  is_active,
  approval_status
FROM user_profiles
WHERE email = 'info@blackmattertech.com';

-- Step 2: Get the correct ID from auth.users
-- This is the ID we need: 0e6bbd59-a24a-4dd5-a5fa-979a971af083
SELECT id as correct_auth_id FROM auth.users WHERE email = 'info@blackmattertech.com';

-- Step 3: Delete the old user_profiles entry (if ID doesn't match)
-- First check if there's a mismatch
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  CASE 
    WHEN au.id = up.id THEN '✅ IDs MATCH - No action needed'
    ELSE '❌ IDs DO NOT MATCH - Need to delete and recreate'
  END as action_needed
FROM auth.users au
LEFT JOIN user_profiles up ON up.email = au.email
WHERE au.email = 'info@blackmattertech.com';

-- Step 4: Delete old entry if ID doesn't match, then create with correct ID
-- Run this if IDs don't match:

-- Delete any user_profiles entry with this email (regardless of ID)
DELETE FROM user_profiles 
WHERE email = 'info@blackmattertech.com';

-- Now create with the correct ID from auth.users
INSERT INTO user_profiles (id, email, role, is_active, approval_status, full_name)
VALUES (
  '0e6bbd59-a24a-4dd5-a5fa-979a971af083',  -- Use the ID from auth.users
  'info@blackmattertech.com',
  'admin',
  true,
  'approved',
  'Admin User'
);

-- Step 5: Verify everything is correct
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
