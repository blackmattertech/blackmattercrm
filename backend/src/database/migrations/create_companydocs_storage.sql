-- Migration: Create private companydocs storage bucket and policies
-- Safe to re-run

INSERT INTO storage.buckets (id, name, public)
VALUES (
  'companydocs',
  'companydocs',
  false
)
ON CONFLICT (id) DO NOTHING;

-- Reset policies safely (idempotent re-run)
DROP POLICY IF EXISTS "Authenticated can upload company docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update company docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete company docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view company docs" ON storage.objects;

-- Private docs: only authenticated users can access the bucket
CREATE POLICY "Authenticated can upload company docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'companydocs');

CREATE POLICY "Authenticated can update company docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'companydocs')
WITH CHECK (bucket_id = 'companydocs');

CREATE POLICY "Authenticated can delete company docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'companydocs');

CREATE POLICY "Authenticated can view company docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'companydocs');

-- Optional future hardening:
-- Restrict to folder convention such as company/<company_id>/... by checking storage.foldername(name)

