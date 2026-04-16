-- Migration: Create blogs schema for CRM blogs module
-- Safe to re-run

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  cover_image_url TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure existing blogs table gets required columns (for older schemas)
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS cover_image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'blogs_status_check'
  ) THEN
    ALTER TABLE public.blogs
      ADD CONSTRAINT blogs_status_check
      CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category_id ON public.blogs(category_id);
CREATE INDEX IF NOT EXISTS idx_blogs_updated_at ON public.blogs(updated_at DESC);

-- Seed minimal categories
INSERT INTO public.blog_categories (name, slug)
VALUES
  ('General', 'general'),
  ('CRM Strategy', 'crm-strategy'),
  ('Marketing', 'marketing')
ON CONFLICT (name) DO NOTHING;
