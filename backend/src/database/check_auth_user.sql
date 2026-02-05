-- Check if user exists in Supabase Auth
-- Run this in Supabase SQL Editor

-- Check user in auth.users table
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'info@blackmattertech.com';

-- Check user in user_profiles table
SELECT 
  id,
  email,
  role,
  is_active,
  approval_status,
  created_at
FROM user_profiles
WHERE email = 'info@blackmattertech.com';

-- If user doesn't exist in auth.users, you need to create them
-- Option 1: Create via Supabase Dashboard > Authentication > Users > Add User
-- Option 2: Use the signup endpoint to create the user
