-- Setup Supabase Storage Buckets
-- Run this in Supabase SQL Editor

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create leads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'leads',
  'leads',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars bucket
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create storage policies for leads bucket
-- Allow authenticated users to upload leads files
CREATE POLICY "Users can upload lead files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'leads');

-- Allow authenticated users to view lead files
CREATE POLICY "Users can view lead files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'leads');

-- Allow authenticated users to update lead files
CREATE POLICY "Users can update lead files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'leads');

-- Allow authenticated users to delete lead files
CREATE POLICY "Users can delete lead files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'leads');
