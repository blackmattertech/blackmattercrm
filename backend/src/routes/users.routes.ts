import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { supabase } from '../index.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (admin only)
 */
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'sales', 'developers', 'designers'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

export default router;
