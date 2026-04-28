import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CRMService, type Lead } from '../services/crm.service.js';
import { authenticate, requireAdmin, requireSales } from '../middleware/auth.middleware.js';
import { supabase } from '../index.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFilePath = path.resolve(__dirname, '..', '..', '..', '.env');

// Configure multer for blog image uploads (memory storage)
const blogImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional().nullable(),
  // Email can be valid email, empty string, or null
  email: z.union([
    z.string().email('Invalid email format'),
    z.literal(''),
    z.null()
  ]).optional().nullable(),
  phone: z.string().optional().nullable().or(z.literal('')),
  value: z.number().min(0).default(0),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  stage: z.string().optional().nullable().or(z.literal('')),
  project_type: z.string().optional().nullable().or(z.literal('')),
  deadline: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  // assigned_to can be a valid UUID, empty string, or null (nullable field)
  assigned_to: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().nullable(),
  // New enhanced fields
  source: z.string().optional().nullable().or(z.literal('')),
  probability: z.number().min(0).max(100).optional().nullable(),
  expected_close_date: z.string().optional().nullable().or(z.literal('')),
  industry: z.string().optional().nullable().or(z.literal('')),
  company_size: z.string().optional().nullable().or(z.literal('')),
  location: z.string().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().nullable(),
  lead_score: z.number().min(0).optional().nullable(),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  assigned_to: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().nullable(),
  linked_lead_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().nullable(),
  linked_project_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().nullable(),
  status: z.enum(['pending', 'in-progress', 'completed', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional().nullable(),
});

const createFollowupSchema = z.object({
  lead_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().nullable(),
  customer_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().nullable(),
  type: z.enum(['call', 'email', 'meeting', 'note', 'other']),
  scheduled_at: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const blogStatusSchema = z.enum(['draft', 'in_review', 'scheduled', 'published', 'archived']);
const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional().nullable().or(z.literal('')),
  content: z.string().optional().nullable().or(z.literal('')),
  featured_image_url: z.string().optional().nullable().or(z.literal('')),
  cover_image_url: z.string().optional().nullable().or(z.literal('')),
  category_id: z.string().optional().nullable().or(z.literal('')),
  category_name: z.string().optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().nullable(),
  status: blogStatusSchema.default('draft'),
  scheduled_at: z.string().optional().nullable().or(z.literal('')),
  published_at: z.string().optional().nullable().or(z.literal('')),
  is_published: z.boolean().optional().nullable(),
  seo_title: z.string().optional().nullable().or(z.literal('')),
  seo_description: z.string().optional().nullable().or(z.literal('')),
});

const isMissingColumnError = (error: any) => {
  const message = (error?.message || '').toLowerCase();
  return error?.code === '42703' || (message.includes('column') && message.includes('does not exist'));
};

const isMissingTableError = (error: any) => {
  const message = (error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('could not find the table')
  );
};

const stripColumns = (payload: Record<string, any>, columns: string[]) => {
  return Object.fromEntries(Object.entries(payload).filter(([key]) => !columns.includes(key)));
};

const isUuid = (value?: string | null) => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

const tryInsertWithFallback = async (payload: Record<string, any>) => {
  const removable = ['is_published', 'seo_title', 'seo_description', 'featured_image_url', 'cover_image_url', 'excerpt', 'content', 'category_id', 'category', 'tags', 'scheduled_at', 'published_at', 'status', 'author_id', 'author_name'];
  let current = { ...payload };
  for (let i = 0; i <= removable.length; i++) {
    const { data, error } = await supabase.from('blogs').insert(current).select('*').single();
    if (!error) return { data, error: null };
    if (!isMissingColumnError(error) || i === removable.length) return { data: null, error };
    current = stripColumns(current, [removable[i]]);
  }
  return { data: null, error: new Error('Insert fallback exhausted') };
};

const tryUpdateWithFallback = async (id: string, payload: Record<string, any>) => {
  const removable = ['is_published', 'seo_title', 'seo_description', 'featured_image_url', 'cover_image_url', 'excerpt', 'content', 'category_id', 'category', 'tags', 'scheduled_at', 'published_at', 'status', 'author_name'];
  let current = { ...payload };
  for (let i = 0; i <= removable.length; i++) {
    const { data, error } = await supabase.from('blogs').update(current).eq('id', id).select('*').single();
    if (!error) return { data, error: null };
    if (!isMissingColumnError(error) || i === removable.length) return { data: null, error };
    current = stripColumns(current, [removable[i]]);
  }
  return { data: null, error: new Error('Update fallback exhausted') };
};

const ensureBlogCategory = async (categoryName?: string | null): Promise<string | null> => {
  const trimmed = (categoryName || '').trim();
  if (!trimmed) return null;

  const { data: existing, error: existingError } = await supabase
    .from('blog_categories')
    .select('id, name')
    .ilike('name', trimmed)
    .limit(1)
    .maybeSingle();

  if (!existingError && existing?.id) return existing.id;

  if (existingError && !isMissingTableError(existingError)) throw existingError;
  if (existingError && isMissingTableError(existingError)) return null;

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  const { data: created, error: createError } = await supabase
    .from('blog_categories')
    .insert({ name: trimmed, slug })
    .select('id')
    .single();

  if (createError) {
    if (isMissingTableError(createError)) return null;
    throw createError;
  }

  return created?.id || null;
};

const normalizeCompanySetupPayload = (body: Record<string, any>, userId?: string, existingId?: string | null) => {
  const offices = Array.isArray(body?.offices) ? body.offices : [];
  const directors = Array.isArray(body?.directors) ? body.directors : [];
  const documents = Array.isArray(body?.documents) ? body.documents : [];
  const now = new Date().toISOString();

  return {
    id: existingId || undefined,
    is_active: true,
    company_name: body?.companyName || null,
    cin: body?.cin || null,
    company_type: body?.companyType || null,
    incorporation_date: body?.incorporationDate || null,
    financial_year_start: body?.financialYearStart || null,
    registered_state: body?.registeredState || null,
    company_pan: body?.companyPan || null,
    company_tan: body?.companyTan || null,
    gst_number: body?.gstNumber || null,
    gst_registration_state: body?.gstRegistrationState || null,
    msme_number: body?.msmeNumber || null,
    iec_number: body?.iecNumber || null,
    professional_tax_number: body?.professionalTaxNumber || null,
    shops_establishment_number: body?.shopsEstablishmentNumber || null,
    official_email: body?.officialEmail || null,
    accounts_email: body?.accountsEmail || null,
    hr_email: body?.hrEmail || null,
    legal_email: body?.legalEmail || null,
    website_url: body?.websiteUrl || null,
    bank_name: body?.bankName || null,
    account_number: body?.accountNumber || null,
    ifsc_code: body?.ifscCode || null,
    account_type: body?.accountType || null,
    branch_name: body?.branchName || null,
    branch_address: body?.branchAddress || null,
    micr_code: body?.micrCode || null,
    swift_code: body?.swiftCode || null,
    directors,
    offices,
    documents,
    payload: body || {},
    created_by: userId || null,
    updated_by: userId || null,
    created_at: now,
    updated_at: now,
  };
};

const upsertEnvValue = (envText: string, key: string, value: string) => {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const line = `${key}=${value}`;
  const keyRegex = new RegExp(`^${escapedKey}=.*$`, 'm');
  if (keyRegex.test(envText)) {
    return envText.replace(keyRegex, line);
  }
  return envText.trimEnd() + `\n${line}\n`;
};

const readEnvText = async () => {
  try {
    return await fs.readFile(envFilePath, 'utf-8');
  } catch (error: any) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
};

/**
 * POST /api/crm/blogs/upload-image
 * Upload blog featured image to Supabase storage
 */
router.post('/blogs/upload-image', requireSales, blogImageUpload.single('image'), async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? extension : 'jpg';
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;

    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Error uploading blog image:', uploadError);
      return res.status(500).json({ success: false, error: 'Failed to upload blog image' });
    }

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    return res.json({
      success: true,
      data: {
        path: filePath,
        url: urlData.publicUrl,
      },
    });
  } catch (error) {
    logger.error('Error in POST /crm/blogs/upload-image:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload blog image' });
  }
});

/**
 * GET /api/crm/blogs
 * Get all blogs with optional filters
 */
router.get('/blogs', async (req, res) => {
  try {
    const { status, search, category_id, limit, offset } = req.query as Record<string, string>;
    let query = supabase.from('blogs').select('*', { count: 'exact' }).order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (category_id) query = query.eq('category_id', category_id);
    if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%,excerpt.ilike.%${search}%`);
    if (limit) query = query.limit(parseInt(limit, 10));
    if (offset && limit) query = query.range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1);

    const { data, error, count } = await query;
    if (error) {
      if (isMissingTableError(error)) {
        logger.warn('GET /blogs - blogs table missing, returning empty list');
        return res.json({ success: true, data: [], count: 0 });
      }
      throw error;
    }

    res.json({ success: true, data: data || [], count: count || 0 });
  } catch (error) {
    logger.error('Error in GET /blogs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blogs' });
  }
});

/**
 * GET /api/crm/blogs/:id
 * Get blog by ID
 */
router.get('/blogs/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('blogs').select('*').eq('id', req.params.id).single();
    if (error) {
      if ((error as any).code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Blog not found' });
      }
      throw error;
    }
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in GET /blogs/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch blog' });
  }
});

/**
 * POST /api/crm/blogs
 * Create new blog
 */
router.post('/blogs', requireSales, async (req, res) => {
  try {
    const parsed = blogSchema.parse(req.body);
    const authUser = (req as any).user || {};
    const userId = authUser.id;
    const now = new Date().toISOString();
    const authorName = (authUser.full_name || authUser.email || 'Unknown Author').trim();
    const categoryLabel = (parsed.category_name || parsed.category || 'General').trim() || 'General';
    const categoryId = isUuid(parsed.category_id) ? parsed.category_id : (await ensureBlogCategory(categoryLabel));

    const payload: Record<string, any> = {
      title: parsed.title.trim(),
      slug: parsed.slug.trim(),
      excerpt: parsed.excerpt || null,
      content: parsed.content || null,
      featured_image_url: parsed.featured_image_url || null,
      cover_image_url: parsed.cover_image_url || parsed.featured_image_url || '',
      category_id: categoryId || null,
      category: categoryLabel,
      tags: parsed.tags || [],
      status: parsed.status || 'draft',
      scheduled_at: parsed.scheduled_at || null,
      published_at: parsed.published_at || null,
      is_published: parsed.is_published ?? parsed.status === 'published',
      seo_title: parsed.seo_title || null,
      seo_description: parsed.seo_description || null,
      author_id: userId,
      author_name: authorName,
      created_at: now,
      updated_at: now,
    };

    const result = await tryInsertWithFallback(payload);
    if (result.error) {
      if (isMissingTableError(result.error)) {
        return res.status(500).json({
          success: false,
          error: 'Blogs table is missing. Run blog schema migration first.',
          code: (result.error as any)?.code,
        });
      }
      throw result.error;
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /blogs:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to create blog',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * PUT /api/crm/blogs/:id
 * Update blog
 */
router.put('/blogs/:id', requireSales, async (req, res) => {
  try {
    const parsed = blogSchema.partial().parse(req.body);
    const authUser = (req as any).user || {};
    const authorName = (authUser.full_name || authUser.email || 'Unknown Author').trim();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
      author_name: authorName,
    };
    const categoryLabel = (parsed.category_name || parsed.category || '').trim();
    const categoryId = isUuid(parsed.category_id) ? parsed.category_id : (await ensureBlogCategory(categoryLabel));

    if (parsed.title !== undefined) updates.title = parsed.title?.trim();
    if (parsed.slug !== undefined) updates.slug = parsed.slug?.trim();
    if (parsed.excerpt !== undefined) updates.excerpt = parsed.excerpt || null;
    if (parsed.content !== undefined) updates.content = parsed.content || null;
    if (parsed.featured_image_url !== undefined) updates.featured_image_url = parsed.featured_image_url || null;
    if (parsed.cover_image_url !== undefined || parsed.featured_image_url !== undefined) {
      updates.cover_image_url = parsed.cover_image_url || parsed.featured_image_url || '';
    }
    if (parsed.category_id !== undefined || parsed.category_name !== undefined || parsed.category !== undefined) {
      updates.category_id = categoryId || null;
      updates.category = categoryLabel || 'General';
    }
    if (parsed.tags !== undefined) updates.tags = parsed.tags || [];
    if (parsed.status !== undefined) updates.status = parsed.status;
    if (parsed.scheduled_at !== undefined) updates.scheduled_at = parsed.scheduled_at || null;
    if (parsed.published_at !== undefined) updates.published_at = parsed.published_at || null;
    if (parsed.is_published !== undefined) updates.is_published = parsed.is_published;
    if (parsed.seo_title !== undefined) updates.seo_title = parsed.seo_title || null;
    if (parsed.seo_description !== undefined) updates.seo_description = parsed.seo_description || null;

    const result = await tryUpdateWithFallback(req.params.id, updates);
    if (result.error) {
      if (isMissingTableError(result.error)) {
        return res.status(500).json({
          success: false,
          error: 'Blogs table is missing. Run blog schema migration first.',
          code: (result.error as any)?.code,
        });
      }
      throw result.error;
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in PUT /blogs/:id:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to update blog',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * PUT /api/crm/blogs/:id/publish
 * Mark blog as published and set is_published=true
 */
router.put('/blogs/:id/publish', requireSales, async (req, res) => {
  try {
    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      status: 'published',
      is_published: true,
      published_at: now,
      updated_at: now,
    };
    const result = await tryUpdateWithFallback(req.params.id, updates);
    if (result.error) {
      if (isMissingTableError(result.error)) {
        return res.status(500).json({
          success: false,
          error: 'Blogs table is missing. Run blog schema migration first.',
          code: (result.error as any)?.code,
        });
      }
      throw result.error;
    }
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Error in PUT /blogs/:id/publish:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to publish blog',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * DELETE /api/crm/blogs/:id
 * Delete blog
 */
router.delete('/blogs/:id', requireSales, async (req, res) => {
  try {
    const { error } = await supabase.from('blogs').delete().eq('id', req.params.id);
    if (error) {
      if (isMissingTableError(error)) {
        return res.status(500).json({
          success: false,
          error: 'Blogs table is missing. Run blog schema migration first.',
          code: (error as any)?.code,
        });
      }
      throw error;
    }
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    logger.error('Error in DELETE /blogs/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to delete blog' });
  }
});

/**
 * GET /api/crm/blog-categories
 * Get blog categories
 */
router.get('/blog-categories', async (req, res) => {
  try {
    const { data, error } = await supabase.from('blog_categories').select('*').order('name', { ascending: true });
    if (error) {
      if (isMissingTableError(error) || isMissingColumnError(error)) {
        return res.json({ success: true, data: [] });
      }
      throw error;
    }
    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Error in GET /blog-categories:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch blog categories',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * POST /api/crm/blog-categories
 * Create blog category (or return existing match)
 */
router.post('/blog-categories', requireSales, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }
    const id = await ensureBlogCategory(name);
    if (!id) {
      return res.status(500).json({ success: false, error: 'Failed to ensure category' });
    }
    const { data, error } = await supabase.from('blog_categories').select('*').eq('id', id).single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) {
    logger.error('Error in POST /blog-categories:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to create category',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * GET /api/crm/company-setup
 * Get active company setup profile
 */
router.get('/company-setup', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('company_setup')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error) || isMissingColumnError(error)) {
        return res.json({ success: true, data: null });
      }
      throw error;
    }

    res.json({ success: true, data: data || null });
  } catch (error) {
    logger.error('Error in GET /company-setup:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch company setup',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * PUT /api/crm/company-setup
 * Save active company setup profile (single-row mode)
 */
router.put('/company-setup', requireSales, async (req, res) => {
  try {
    const body = (req.body || {}) as Record<string, any>;
    const userId = (req as any)?.user?.id;

    const { data: existing, error: existingError } = await supabase
      .from('company_setup')
      .select('id')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      if (isMissingTableError(existingError) || isMissingColumnError(existingError)) {
        return res.status(500).json({
          success: false,
          error: 'company_setup table is missing. Run company setup migrations first.',
          code: (existingError as any)?.code,
        });
      }
      throw existingError;
    }

    const normalized = normalizeCompanySetupPayload(body, userId, existing?.id || null);
    const now = new Date().toISOString();

    if (existing?.id) {
      const updatePayload = {
        ...normalized,
        created_by: undefined,
        created_at: undefined,
        updated_at: now,
      };
      const { data, error } = await supabase
        .from('company_setup')
        .update(updatePayload)
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) throw error;
      return res.json({ success: true, data });
    }

    const { data, error } = await supabase
      .from('company_setup')
      .insert({
        ...normalized,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, data });
  } catch (error) {
    logger.error('Error in PUT /company-setup:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to save company setup',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * GET /api/crm/integrations/payment-config
 * Read payment integration config from runtime env
 */
router.get('/integrations/payment-config', requireAdmin, async (_req, res) => {
  try {
    res.json({
      success: true,
      data: {
        cashfree: {
          appId: process.env.CASHFREE_APP_ID || '',
          secretKey: process.env.CASHFREE_SECRET_KEY || '',
          webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || '',
          environment: process.env.CASHFREE_ENVIRONMENT || 'sandbox',
        },
        razorpay: {
          keyId: process.env.RAZORPAY_KEY_ID || '',
          keySecret: process.env.RAZORPAY_KEY_SECRET || '',
          webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
          accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
          environment: process.env.RAZORPAY_ENVIRONMENT || 'test',
        },
        mailjet: {
          apiKey: process.env.MAILJET_API_KEY || '',
          secretKey: process.env.MAILJET_SECRET_KEY || '',
          fromEmail: process.env.MAILJET_FROM_EMAIL || '',
          fromName: process.env.MAILJET_FROM_NAME || '',
        },
        mailersend: {
          apiKey: process.env.MAILERSEND_API_KEY || '',
          fromEmail: process.env.MAILERSEND_FROM_EMAIL || '',
          fromName: process.env.MAILERSEND_FROM_NAME || '',
        },
        activeProviders: {
          payment: process.env.PAYMENT_PROVIDER || '',
          email: process.env.EMAIL_PROVIDER || '',
        },
      },
    });
  } catch (error) {
    logger.error('Error in GET /integrations/payment-config:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch payment config',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * PUT /api/crm/integrations/payment-config
 * Save payment integration config to .env and process.env
 */
router.put('/integrations/payment-config', requireAdmin, async (req, res) => {
  try {
    const cashfree = (req.body?.cashfree || {}) as Record<string, string>;
    const razorpay = (req.body?.razorpay || {}) as Record<string, string>;
    const mailjet = (req.body?.mailjet || {}) as Record<string, string>;
    const mailersend = (req.body?.mailersend || {}) as Record<string, string>;
    const provider = String(req.body?.provider || '').toLowerCase();

    if (!provider || !['cashfree', 'razorpay', 'mailjet', 'mailersend'].includes(provider)) {
      return res.status(400).json({ success: false, error: 'Invalid provider' });
    }

    let envText = await readEnvText();
    const updates: Record<string, string> = {};

    if (provider === 'cashfree') {
      if (!cashfree.appId || !cashfree.secretKey || !cashfree.webhookSecret || !cashfree.environment) {
        return res.status(400).json({ success: false, error: 'Missing required Cashfree fields' });
      }
      updates.PAYMENT_PROVIDER = 'cashfree';
      updates.CASHFREE_APP_ID = cashfree.appId;
      updates.CASHFREE_SECRET_KEY = cashfree.secretKey;
      updates.CASHFREE_WEBHOOK_SECRET = cashfree.webhookSecret;
      updates.CASHFREE_ENVIRONMENT = cashfree.environment;
    }

    if (provider === 'razorpay') {
      if (!razorpay.keyId || !razorpay.keySecret || !razorpay.webhookSecret || !razorpay.accountNumber || !razorpay.environment) {
        return res.status(400).json({ success: false, error: 'Missing required Razorpay fields' });
      }
      updates.PAYMENT_PROVIDER = 'razorpay';
      updates.RAZORPAY_KEY_ID = razorpay.keyId;
      updates.RAZORPAY_KEY_SECRET = razorpay.keySecret;
      updates.RAZORPAY_WEBHOOK_SECRET = razorpay.webhookSecret;
      updates.RAZORPAY_ACCOUNT_NUMBER = razorpay.accountNumber;
      updates.RAZORPAY_ENVIRONMENT = razorpay.environment;
    }

    if (provider === 'mailjet') {
      if (!mailjet.apiKey || !mailjet.secretKey || !mailjet.fromEmail || !mailjet.fromName) {
        return res.status(400).json({ success: false, error: 'Missing required Mailjet fields' });
      }
      updates.EMAIL_PROVIDER = 'mailjet';
      updates.MAILJET_API_KEY = mailjet.apiKey;
      updates.MAILJET_SECRET_KEY = mailjet.secretKey;
      updates.MAILJET_FROM_EMAIL = mailjet.fromEmail;
      updates.MAILJET_FROM_NAME = mailjet.fromName;
    }

    if (provider === 'mailersend') {
      if (!mailersend.apiKey || !mailersend.fromEmail || !mailersend.fromName) {
        return res.status(400).json({ success: false, error: 'Missing required MailerSend fields' });
      }
      updates.EMAIL_PROVIDER = 'mailersend';
      updates.MAILERSEND_API_KEY = mailersend.apiKey;
      updates.MAILERSEND_FROM_EMAIL = mailersend.fromEmail;
      updates.MAILERSEND_FROM_NAME = mailersend.fromName;
    }

    for (const [key, value] of Object.entries(updates)) {
      envText = upsertEnvValue(envText, key, value);
      process.env[key] = value;
    }

    await fs.writeFile(envFilePath, envText, 'utf-8');

    return res.json({
      success: true,
      message: `${provider} configuration saved to .env`,
    });
  } catch (error) {
    logger.error('Error in PUT /integrations/payment-config:', error);
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to save payment config',
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
    });
  }
});

/**
 * GET /api/crm/leads
 * Get all leads with optional filters
 */
router.get('/leads', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      assigned_to: req.query.assigned_to as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await CRMService.getLeads(filters);
    res.json({ success: true, data: result.data, count: result.count });
  } catch (error) {
    logger.error('Error in GET /leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

/**
 * GET /api/crm/leads/:id
 * Get lead by ID
 */
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await CRMService.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error in GET /leads/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
});

/**
 * POST /api/crm/leads
 * Create new lead
 */
router.post('/leads', requireSales, async (req, res) => {
  try {
    logger.info('POST /api/crm/leads - Request received', {
      body: req.body,
      user: (req as any).user,
      headers: {
        authorization: req.headers.authorization ? 'Bearer ***' : 'missing',
        origin: req.headers.origin,
        'content-type': req.headers['content-type'],
      },
    });
    
    const leadData = createLeadSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    logger.info('Lead data validated, userId:', userId);
    
    // Clean up empty strings to null/undefined for optional fields
    const cleanedData: any = {
      ...leadData,
      company: leadData.company || undefined,
      email: leadData.email || undefined,
      phone: leadData.phone || undefined,
      stage: leadData.stage || undefined,
      project_type: leadData.project_type || undefined,
      deadline: leadData.deadline || undefined,
      notes: leadData.notes || undefined,
      // assigned_to should be null if empty string or undefined (nullable field)
      assigned_to: (leadData.assigned_to && typeof leadData.assigned_to === 'string' && leadData.assigned_to.trim() !== '') 
        ? leadData.assigned_to.trim() 
        : null,
    };
    
    logger.info('Cleaned lead data:', cleanedData);
    const lead = await CRMService.createLead(cleanedData, userId);
    logger.info('Lead created successfully:', lead.id);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error in POST /leads:', {
        errors: error.errors,
        receivedData: req.body,
      });
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /leads:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      receivedData: req.body,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
});

/**
 * PUT /api/crm/leads/:id
 * Update lead
 */
router.put('/leads/:id', requireSales, async (req, res) => {
  try {
    const parsed = createLeadSchema.partial().parse(req.body);
    const userId = (req as any).user.id;
    // Normalize null to undefined so updates match Partial<Lead>
    const updates = Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, v === null ? undefined : v])
    ) as Partial<Lead>;

    const lead = await CRMService.updateLead(req.params.id, updates, userId);
    res.json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in PUT /leads/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

/**
 * DELETE /api/crm/leads/:id
 * Delete lead
 */
router.delete('/leads/:id', requireSales, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await CRMService.deleteLead(req.params.id, userId);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    logger.error('Error in DELETE /leads/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

/**
 * GET /api/crm/tasks
 * Get all tasks
 */
router.get('/tasks', async (req, res) => {
  try {
    const filters = {
      assigned_to: req.query.assigned_to as string,
      linked_lead_id: req.query.linked_lead_id as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await CRMService.getTasks(filters);
    res.json({ success: true, data: result.data, count: result.count });
  } catch (error) {
    logger.error('Error in GET /tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /api/crm/tasks
 * Create new task
 */
router.post('/tasks', async (req, res) => {
  try {
    const body = createTaskSchema.parse(req.body);
    const userId = (req as any).user.id;
    const taskData = {
      ...body,
      assigned_to: body.assigned_to || undefined,
      linked_lead_id: body.linked_lead_id || undefined,
      linked_project_id: body.linked_project_id || undefined,
    };
    const task = await CRMService.createTask(taskData, userId);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

/**
 * GET /api/crm/followups
 * Get all followups
 */
router.get('/followups', async (req, res) => {
  try {
    const filters = {
      lead_id: req.query.lead_id as string,
      customer_id: req.query.customer_id as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await CRMService.getFollowups(filters);
    res.json({ success: true, data: result.data, count: result.count });
  } catch (error) {
    logger.error('Error in GET /followups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch followups' });
  }
});

/**
 * POST /api/crm/followups
 * Create new followup
 */
router.post('/followups', async (req, res) => {
  try {
    const body = createFollowupSchema.parse(req.body);
    const userId = (req as any).user.id;
    const followupData = {
      ...body,
      lead_id: body.lead_id || undefined,
      customer_id: body.customer_id || undefined,
    };
    const followup = await CRMService.createFollowup(followupData, userId);
    res.status(201).json({ success: true, data: followup });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /followups:', error);
    res.status(500).json({ success: false, error: 'Failed to create followup' });
  }
});

/**
 * GET /api/crm/activities
 * Get activity logs
 */
router.get('/activities', async (req, res) => {
  try {
    const filters = {
      entity_type: req.query.entity_type as string,
      entity_id: req.query.entity_id as string,
      user_id: req.query.user_id as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await CRMService.getActivityLogs(filters);
    res.json({ success: true, data: result.data, count: result.count });
  } catch (error) {
    logger.error('Error in GET /activities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
});

/**
 * GET /api/crm/leads/:id/activities
 * Get activity timeline for a lead
 */
router.get('/leads/:id/activities', async (req, res) => {
  try {
    const activities = await CRMService.getLeadActivityTimeline(req.params.id);
    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error in GET /leads/:id/activities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead activities' });
  }
});

/**
 * PUT /api/crm/leads/:id/status
 * Quick update lead status
 */
router.put('/leads/:id/status', requireSales, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const userId = (req as any).user.id;
    const lead = await CRMService.updateLeadStatus(req.params.id, status, userId);
    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error in PUT /leads/:id/status:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead status' });
  }
});

/**
 * POST /api/crm/leads/:id/convert-to-customer
 * Convert lead to customer
 */
router.post('/leads/:id/convert-to-customer', requireSales, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const customer = await CRMService.convertLeadToCustomer(req.params.id, userId);
    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error in POST /leads/:id/convert-to-customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to convert lead to customer';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Customer validation schema
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional().nullable(),
  email: z.union([
    z.string().email('Invalid email format'),
    z.literal(''),
    z.null()
  ]).optional().nullable(),
  phone: z.string().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
  gstin: z.string().optional().nullable().or(z.literal('')),
  pan: z.string().optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  lead_id: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/crm/customers
 * Get all customers with optional filters
 */
router.get('/customers', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await CRMService.getCustomers(filters);
    res.json({ success: true, data: result.data, count: result.count });
  } catch (error) {
    logger.error('Error in GET /customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/crm/customers/:id
 * Get customer by ID
 */
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await CRMService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error in GET /customers/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

/**
 * POST /api/crm/customers
 * Create new customer
 */
router.post('/customers', requireSales, async (req, res) => {
  try {
    const customerData = createCustomerSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const customer = await CRMService.createCustomer(customerData, userId);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /customers:', error);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
});

/**
 * PUT /api/crm/customers/:id
 * Update customer
 */
router.put('/customers/:id', requireSales, async (req, res) => {
  try {
    const updates = createCustomerSchema.partial().parse(req.body);
    const userId = (req as any).user.id;
    
    const customer = await CRMService.updateCustomer(req.params.id, updates, userId);
    res.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in PUT /customers/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
});

/**
 * DELETE /api/crm/customers/:id
 * Delete customer
 */
router.delete('/customers/:id', requireSales, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await CRMService.deleteCustomer(req.params.id, userId);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    logger.error('Error in DELETE /customers/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
});

export default router;
