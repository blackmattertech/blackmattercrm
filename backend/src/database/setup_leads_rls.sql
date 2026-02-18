-- RLS Policies for Leads Table
-- Run this in Supabase SQL Editor to enable proper access

-- Enable RLS (if not already enabled)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all leads
CREATE POLICY "Authenticated users can view leads"
ON leads FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users with sales/admin role can insert leads
CREATE POLICY "Sales and admin can create leads"
ON leads FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'sales')
    AND user_profiles.is_active = true
    AND user_profiles.approval_status = 'approved'
  )
);

-- Policy: Users can update leads they created or are assigned to
CREATE POLICY "Users can update their leads"
ON leads FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'sales')
    AND user_profiles.is_active = true
    AND user_profiles.approval_status = 'approved'
  )
);

-- Policy: Users can delete leads they created or admins can delete any
CREATE POLICY "Users can delete their leads"
ON leads FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
    AND user_profiles.is_active = true
    AND user_profiles.approval_status = 'approved'
  )
);
