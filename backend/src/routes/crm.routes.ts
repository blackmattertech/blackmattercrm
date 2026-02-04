import express from 'express';
import { CRMService } from '../services/crm.service.js';
import { authenticate, requireSales } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createLeadSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  value: z.number().min(0).default(0),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  stage: z.string().optional(),
  project_type: z.string().optional(),
  deadline: z.string().optional(),
  notes: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
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
    const leadData = createLeadSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const lead = await CRMService.createLead(leadData, userId);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /leads:', error);
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
});

/**
 * PUT /api/crm/leads/:id
 * Update lead
 */
router.put('/leads/:id', requireSales, async (req, res) => {
  try {
    const updates = createLeadSchema.partial().parse(req.body);
    const userId = (req as any).user.id;
    
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
    const userId = (req as any).user.id;
    const task = await CRMService.createTask(req.body, userId);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
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
    const userId = (req as any).user.id;
    const followup = await CRMService.createFollowup(req.body, userId);
    res.status(201).json({ success: true, data: followup });
  } catch (error) {
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

export default router;
