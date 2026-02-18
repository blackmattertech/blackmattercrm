-- Migration: Add enhanced fields to leads table
-- Run this in Supabase SQL Editor

-- Add new columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS source VARCHAR(100),
ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_size VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_probability ON leads(probability);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON leads(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity_at);

-- Add comment to columns
COMMENT ON COLUMN leads.source IS 'Lead source (website, referral, cold call, etc.)';
COMMENT ON COLUMN leads.probability IS 'Win probability percentage (0-100)';
COMMENT ON COLUMN leads.expected_close_date IS 'Expected close date';
COMMENT ON COLUMN leads.industry IS 'Industry type';
COMMENT ON COLUMN leads.company_size IS 'Company size (Startup, Small, Medium, Large, Enterprise)';
COMMENT ON COLUMN leads.location IS 'Location/address';
COMMENT ON COLUMN leads.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN leads.lead_score IS 'Calculated lead score';
COMMENT ON COLUMN leads.last_activity_at IS 'Last activity timestamp';
