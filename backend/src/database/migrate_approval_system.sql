-- Migration: Add approval system for user signups
-- Run this in Supabase SQL Editor

-- Add approval_status column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add approved_by column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id);

-- Add approved_at column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Make email NOT NULL if it isn't already
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'email'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE user_profiles
        ALTER COLUMN email SET NOT NULL;
    END IF;
END $$;

-- Set default is_active to false for new signups
-- Existing users should remain active
UPDATE user_profiles
SET is_active = false, approval_status = 'pending'
WHERE approval_status IS NULL OR approval_status = 'pending';

-- For existing users without approval_status, mark them as approved
UPDATE user_profiles
SET approval_status = 'approved', is_active = true
WHERE approval_status IS NULL AND is_active = true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status 
ON user_profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active 
ON user_profiles(is_active);
