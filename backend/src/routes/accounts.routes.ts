import express from 'express';
import { authenticate, requireSales } from '../middleware/auth.middleware.js';

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

export default router;
