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
  company: z.string().optional().nullable(),
  email: z.union([z.string().email(), z.literal('')]).optional().nullable(),
  phone: z.string().optional().nullable().or(z.literal('')),
  value: z.number().min(0).default(0),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  stage: z.string().optional().nullable().or(z.literal('')),
  project_type: z.string().optional().nullable().or(z.literal('')),
  deadline: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  assigned_to: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
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
    logger.info('Creating lead - Request body:', req.body);
    logger.info('User:', (req as any).user);
    
    const leadData = createLeadSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    // Clean up empty strings to undefined for optional fields
    const cleanedData: any = {
      ...leadData,
      company: leadData.company || undefined,
      email: leadData.email || undefined,
      phone: leadData.phone || undefined,
      stage: leadData.stage || undefined,
      project_type: leadData.project_type || undefined,
      deadline: leadData.deadline || undefined,
      notes: leadData.notes || undefined,
      assigned_to: leadData.assigned_to || undefined,
    };
    
    logger.info('Cleaned lead data:', cleanedData);
    const lead = await CRMService.createLead(cleanedData, userId);
    logger.info('Lead created successfully:', lead.id);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error in POST /leads:', error.errors);
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: 'Failed to create lead', message: errorMessage });
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
