import express from 'express';
import { authenticate, requireSales } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/campaigns', requireSales, async (req, res) => {
  res.json({ success: true, data: [], message: 'Campaigns - coming soon' });
});

router.get('/metrics', requireSales, async (req, res) => {
  res.json({ success: true, data: [], message: 'Metrics - coming soon' });
});

export default router;
