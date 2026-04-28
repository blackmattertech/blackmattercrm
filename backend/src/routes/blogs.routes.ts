import express from 'express';
import { supabase } from '../index.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = express.Router();

// Blogs are shown inside the app, so require auth by default.
router.use(authenticate);

const BLOGS_TABLE = process.env.BLOGS_TABLE || 'blogs';
const BLOG_CATEGORIES_TABLE = process.env.BLOG_CATEGORIES_TABLE || 'blog_categories';

const blogStatusSchema = z.enum(['draft', 'in_review', 'scheduled', 'published', 'archived']);

const createBlogSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  excerpt: z.string().min(1),
  cover_image_url: z.string().min(1),
  category: z.string().min(1),
  author_name: z.string().min(1),
  read_time_minutes: z.number().int().min(1).optional(),
  content_json: z.any().optional(),
  content: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: blogStatusSchema.optional(),
  scheduled_at: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  is_published: z.boolean().optional(),
});

const updateBlogSchema = createBlogSchema.partial();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from(BLOGS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching blogs:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: data || [] });
  } catch (e: any) {
    logger.error('Blogs list exception:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from(BLOGS_TABLE).select('*').eq('id', id).single();

    if (error) {
      const status = (error as any).code === 'PGRST116' ? 404 : 500;
      return res.status(status).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data });
  } catch (e: any) {
    logger.error('Blogs get exception:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const parsed = createBlogSchema.parse(req.body);
    const nowIso = new Date().toISOString();
    const isPublished = parsed.is_published === true || parsed.status === 'published';

    const payload: any = {
      ...parsed,
      read_time_minutes: parsed.read_time_minutes ?? 3,
      tags: parsed.tags ?? [],
      status: parsed.status ?? (isPublished ? 'published' : 'draft'),
      is_published: isPublished,
      published_at: isPublished ? nowIso : null,
      updated_at: nowIso,
    };

    const { data, error } = await supabase.from(BLOGS_TABLE).insert(payload).select('*').single();
    if (error) {
      logger.error('Error creating blog:', error);
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid request data', details: e.errors });
    }
    logger.error('Create blog exception:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = updateBlogSchema.parse(req.body);
    const nowIso = new Date().toISOString();

    const wantsPublished = parsed.is_published === true || parsed.status === 'published';
    const payload: any = {
      ...parsed,
      updated_at: nowIso,
    };
    if (parsed.status) {
      payload.is_published = parsed.status === 'published';
      if (payload.is_published) payload.published_at = nowIso;
    }
    if (typeof parsed.is_published === 'boolean') {
      payload.is_published = parsed.is_published;
      if (parsed.is_published) payload.published_at = nowIso;
    }
    if (wantsPublished && !('published_at' in payload)) {
      payload.published_at = nowIso;
    }

    const { data, error } = await supabase.from(BLOGS_TABLE).update(payload).eq('id', id).select('*').single();
    if (error) {
      logger.error('Error updating blog:', error);
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid request data', details: e.errors });
    }
    logger.error('Update blog exception:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from(BLOGS_TABLE)
      .update({ is_published: true, status: 'published', published_at: nowIso, updated_at: nowIso })
      .eq('id', id)
      .select('*')
      .single();

    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (e: any) {
    logger.error('Publish blog exception:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Categories
router.get('/categories/list', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from(BLOG_CATEGORIES_TABLE)
      .select('*')
      .order('name', { ascending: true });
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, data: data || [] });
  } catch (e: any) {
    logger.error('List categories exception:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1).optional().nullable(),
    });
    const parsed = schema.parse(req.body);
    const nowIso = new Date().toISOString();
    const payload: any = { ...parsed, updated_at: nowIso };
    const { data, error } = await supabase.from(BLOG_CATEGORIES_TABLE).insert(payload).select('*').single();
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid request data', details: e.errors });
    }
    logger.error('Create category exception:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;

