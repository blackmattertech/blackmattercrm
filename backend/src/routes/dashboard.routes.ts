import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { redis } from '../index.js';
import { supabase } from '../index.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics with Redis caching
 */
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'dashboard:stats';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), cached: true });
    }

    // Fetch from database
    const [leadsResult, invoicesResult, tasksResult] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('id', { count: 'exact', head: true }),
      supabase.from('tasks').select('id', { count: 'exact', head: true }),
    ]);

    const stats = {
      totalLeads: leadsResult.count || 0,
      totalInvoices: invoicesResult.count || 0,
      totalTasks: tasksResult.count || 0,
      timestamp: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(stats));

    res.json({ success: true, data: stats, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

/**
 * GET /api/dashboard/analytics
 * Get dashboard analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const cacheKey = 'dashboard:analytics';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json({ success: true, data: JSON.parse(cached), cached: true });
    }

    // Placeholder analytics data
    const analytics = {
      revenue: { current: 0, previous: 0, change: 0 },
      expenses: { current: 0, previous: 0, change: 0 },
      pipeline: { value: 0, count: 0 },
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(analytics));

    res.json({ success: true, data: analytics, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;
