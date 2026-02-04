-- Migration: Update user_profiles for email authentication
-- Run this in Supabase SQL Editor

-- Add email column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Make phone optional (remove NOT NULL constraint if exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'phone' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE user_profiles 
        ALTER COLUMN phone DROP NOT NULL;
    END IF;
END $$;

-- Remove unique constraint on phone if it exists (since it's now optional)
DROP INDEX IF EXISTS user_profiles_phone_key;

-- Add unique constraint on email (only for non-null emails)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email) 
WHERE email IS NOT NULL;

-- Update existing users to have email from auth.users if available
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id 
AND up.email IS NULL 
AND au.email IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_profiles.email IS 'User email address (primary identifier for email auth)';
COMMENT ON COLUMN user_profiles.phone IS 'User phone number (optional, for backward compatibility)';
