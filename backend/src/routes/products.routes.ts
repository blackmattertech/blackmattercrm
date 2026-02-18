import express from 'express';
import { authenticate, requireSales } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/products', async (req, res) => {
  res.json({ success: true, data: [], message: 'Products - coming soon' });
});

router.get('/subscriptions', requireSales, async (req, res) => {
  res.json({ success: true, data: [], message: 'Subscriptions - coming soon' });
});

export default router;
