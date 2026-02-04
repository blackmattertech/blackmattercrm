import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { supabase } from '../index.js';

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

export default router;
