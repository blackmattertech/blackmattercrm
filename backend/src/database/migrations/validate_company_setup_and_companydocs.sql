-- Validation checks for:
-- 1) public.company_setup table + indexes
-- 2) storage bucket companydocs + policies
--
-- Run after applying:
-- - create_company_setup_schema.sql
-- - create_companydocs_storage.sql

-- Table exists
SELECT to_regclass('public.company_setup') AS company_setup_table;

-- Columns sanity
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'company_setup'
  AND column_name IN (
    'id', 'is_active', 'company_name', 'cin', 'company_type',
    'registered_state', 'company_pan', 'company_tan', 'gst_number',
    'directors', 'offices', 'documents', 'payload',
    'created_by', 'updated_by', 'created_at', 'updated_at'
  )
ORDER BY column_name;

-- Indexes sanity
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'company_setup'
ORDER BY indexname;

-- Bucket exists and is private
SELECT id, name, public
FROM storage.buckets
WHERE id = 'companydocs';

-- Policies present
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'Authenticated can upload company docs',
    'Authenticated can update company docs',
    'Authenticated can delete company docs',
    'Authenticated can view company docs'
  )
ORDER BY policyname;

-- Optional functional smoke test for one active row
-- (safe: uses transaction + rollback)
BEGIN;
INSERT INTO public.company_setup (company_name, is_active)
VALUES ('Validation Row', true)
ON CONFLICT DO NOTHING;
SELECT id, company_name, is_active FROM public.company_setup WHERE is_active = true LIMIT 1;
ROLLBACK;

