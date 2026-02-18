-- Fix user created manually in Supabase Auth
-- Run this in Supabase SQL Editor

-- Step 1: Get the auth.users ID
SELECT id, email FROM auth.users WHERE email = 'info@blackmattertech.com';

-- Step 2: Check current user_profiles entry
SELECT id, email, role, is_active, approval_status 
FROM user_profiles 
WHERE email = 'info@blackmattertech.com';

-- Step 3: If user_profiles doesn't exist OR IDs don't match, fix it:

-- Option A: If user_profiles doesn't exist, create it with the correct ID
-- Replace '0e6bbd59-a24a-4dd5-a5fa-979a971af083' with the actual auth.users ID from Step 1
INSERT INTO user_profiles (id, email, role, is_active, approval_status)
VALUES (
  '0e6bbd59-a24a-4dd5-a5fa-979a971af083',  -- Use the ID from auth.users
  'info@blackmattertech.com',
  'admin',
  true,
  'approved'
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = 'admin',
  is_active = true,
  approval_status = 'approved';

-- Option B: If user_profiles exists but ID is wrong, update it
-- First, delete the old entry (if ID is different)
-- DELETE FROM user_profiles WHERE email = 'info@blackmattertech.com' AND id != '0e6bbd59-a24a-4dd5-a5fa-979a971af083';

-- Then create/update with correct ID
INSERT INTO user_profiles (id, email, role, is_active, approval_status)
VALUES (
  '0e6bbd59-a24a-4dd5-a5fa-979a971af083',  -- Use the ID from auth.users
  'info@blackmattertech.com',
  'admin',
  true,
  'approved'
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = 'admin',
  is_active = true,
  approval_status = 'approved';

-- Step 4: Verify everything matches
SELECT 
  au.id as auth_id,
  up.id as profile_id,
  au.email as auth_email,
  up.email as profile_email,
  CASE 
    WHEN au.id = up.id THEN '✅ IDs MATCH'
    ELSE '❌ IDs DO NOT MATCH'
  END as id_status,
  up.role,
  up.is_active,
  up.approval_status,
  CASE 
    WHEN up.is_active = true AND up.approval_status = 'approved' THEN '✅ READY TO LOGIN'
    ELSE '❌ NOT READY - CHECK is_active AND approval_status'
  END as login_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'info@blackmattertech.com';
