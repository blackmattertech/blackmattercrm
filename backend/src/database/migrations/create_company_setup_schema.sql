-- Migration: Create single-table company setup schema
-- Safe to re-run

CREATE TABLE IF NOT EXISTS public.company_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Company identity
  company_name TEXT,
  cin TEXT,
  company_type TEXT,
  incorporation_date DATE,
  financial_year_start TEXT,
  registered_state TEXT,
  company_pan TEXT,
  company_tan TEXT,

  -- Tax registrations
  gst_number TEXT,
  gst_registration_state TEXT,
  msme_number TEXT,
  iec_number TEXT,
  professional_tax_number TEXT,
  shops_establishment_number TEXT,

  -- Communication
  official_email TEXT,
  accounts_email TEXT,
  hr_email TEXT,
  legal_email TEXT,
  website_url TEXT,

  -- Bank details
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_type TEXT,
  branch_name TEXT,
  branch_address TEXT,
  micr_code TEXT,
  swift_code TEXT,

  -- Flexible lists
  directors JSONB NOT NULL DEFAULT '[]'::jsonb,
  offices JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Full snapshot
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure existing table gets required columns (for older schemas)
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS cin TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS company_type TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS incorporation_date DATE;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS financial_year_start TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS registered_state TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS company_pan TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS company_tan TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS gst_registration_state TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS msme_number TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS iec_number TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS professional_tax_number TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS shops_establishment_number TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS official_email TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS accounts_email TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS hr_email TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS legal_email TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS branch_name TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS branch_address TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS micr_code TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS swift_code TEXT;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS directors JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS offices JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.company_setup ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure only one active row
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_setup_single_active
ON public.company_setup (is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_company_setup_company_name ON public.company_setup(company_name);
CREATE INDEX IF NOT EXISTS idx_company_setup_updated_at ON public.company_setup(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_setup_payload_gin ON public.company_setup USING GIN (payload);

