-- Migration: Create blog images storage bucket and policies
-- Run in Supabase SQL editor or as part of DB migration workflow

-- Optional: Ensure blogs table can store featured image URL (if blogs table exists)
DO $$
BEGIN
  IF to_regclass('public.blogs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS featured_image_url TEXT';
    EXECUTE 'ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false';
    EXECUTE 'ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ';
  END IF;
END
$$;

-- Create public bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Reset policies safely (idempotent re-run)
DROP POLICY IF EXISTS "Authenticated can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;

-- Upload policy: authenticated users can upload into their own folder
CREATE POLICY "Authenticated can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update policy: users can update files inside their own folder
CREATE POLICY "Authenticated can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete policy: users can delete files inside their own folder
CREATE POLICY "Authenticated can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Read policy: public can view published blog images
CREATE POLICY "Public can view blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');
