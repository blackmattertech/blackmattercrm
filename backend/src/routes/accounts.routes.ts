import express from 'express';
import { authenticate, requireSales } from '../middleware/auth.middleware.js';
import { supabase } from '../index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/invoices', requireSales, async (req, res) => {
  res.json({ success: true, data: [], message: 'Accounts module - coming soon' });
});

router.get('/payments', requireSales, async (req, res) => {
  res.json({ success: true, data: [], message: 'Payments - coming soon' });
});

router.get('/chart-of-accounts', requireSales, async (req, res) => {
  res.json({ success: true, data: [], message: 'Chart of accounts - coming soon' });
});

router.get('/trial-balance', requireSales, async (req, res) => {
  res.json({ success: true, data: [], message: 'Trial balance - coming soon' });
});

/**
 * GET /api/accounts/directors
 * Get all directors with their capital account details
 */
router.get('/directors', authenticate, async (req, res) => {
  try {
    // Get directors from user_profiles
    const { data: directors, error } = await supabase
      .from('user_profiles')
      .select('id, email, phone, full_name, role, avatar_url, is_director, equity_ratio, created_at')
      .eq('is_director', true)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // For now, return directors with empty capital transactions
    // TODO: In future, fetch from journal_entries or director_capital_transactions table
    const directorsWithCapital = (directors || []).map((director) => ({
      id: director.id,
      name: director.full_name || director.email.split('@')[0],
      email: director.email,
      phone: director.phone,
      role: director.role,
      equity_ratio: director.equity_ratio || 0,
      openingCapital: 0, // Will be calculated from journal entries in future
      additionalCapital: [], // Will be fetched from journal entries in future
      drawings: [], // Will be fetched from journal entries in future
    }));

    res.json({ success: true, data: directorsWithCapital });
  } catch (error) {
    logger.error('Error fetching directors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch directors' });
  }
});

export default router;
