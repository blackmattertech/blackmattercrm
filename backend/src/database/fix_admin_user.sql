-- Fix admin user to allow login
-- Run this in Supabase SQL Editor

-- Replace 'your-admin-email@example.com' with your actual admin email
UPDATE user_profiles
SET 
  is_active = true,
  approval_status = 'approved',
  role = 'admin'
WHERE email = 'your-admin-email@example.com';

-- Or if you want to approve all existing users with is_active = true:
UPDATE user_profiles
SET 
  approval_status = 'approved'
WHERE is_active = true AND (approval_status IS NULL OR approval_status != 'approved');

-- Verify the update
SELECT id, email, role, is_active, approval_status 
FROM user_profiles 
WHERE email = 'your-admin-email@example.com';
