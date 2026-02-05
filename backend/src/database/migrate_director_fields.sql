-- Migration: Add director and equity_ratio fields to user_profiles
-- Run this in Supabase SQL Editor

-- Add director and equity_ratio columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_director BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS equity_ratio DECIMAL(5, 2) DEFAULT 0.00 CHECK (equity_ratio >= 0 AND equity_ratio <= 100);

-- Add index for director queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_director ON user_profiles(is_director) WHERE is_director = true;

-- Add comment
COMMENT ON COLUMN user_profiles.is_director IS 'Indicates if user is a director/partner';
COMMENT ON COLUMN user_profiles.equity_ratio IS 'Equity percentage (0-100) for directors';
