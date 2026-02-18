import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

// Placeholder routes - to be implemented
router.get('/members', async (req, res) => {
  res.json({ success: true, data: [], message: 'Team members - coming soon' });
});

router.get('/availability', async (req, res) => {
  res.json({ success: true, data: [], message: 'Availability - coming soon' });
});

router.get('/earnings', async (req, res) => {
  res.json({ success: true, data: [], message: 'Earnings - coming soon' });
});

export default router;
