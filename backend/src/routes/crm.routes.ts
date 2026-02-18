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
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional().nullable(),
  // Email can be valid email, empty string, or null
  email: z.union([
    z.string().email('Invalid email format'),
    z.literal(''),
    z.null()
  ]).optional().nullable(),
  phone: z.string().optional().nullable().or(z.literal('')),
  value: z.number().min(0).default(0),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  stage: z.string().optional().nullable().or(z.literal('')),
  project_type: z.string().optional().nullable().or(z.literal('')),
  deadline: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  // assigned_to can be a valid UUID, empty string, or null (nullable field)
  assigned_to: z.union([z.string().uuid(), z.literal(''), z.null()]).optional().nullable(),
  // New enhanced fields
  source: z.string().optional().nullable().or(z.literal('')),
  probability: z.number().min(0).max(100).optional().nullable(),
  expected_close_date: z.string().optional().nullable().or(z.literal('')),
  industry: z.string().optional().nullable().or(z.literal('')),
  company_size: z.string().optional().nullable().or(z.literal('')),
  location: z.string().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().nullable(),
  lead_score: z.number().min(0).optional().nullable(),
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
    logger.info('POST /api/crm/leads - Request received', {
      body: req.body,
      user: (req as any).user,
      headers: {
        authorization: req.headers.authorization ? 'Bearer ***' : 'missing',
        origin: req.headers.origin,
        'content-type': req.headers['content-type'],
      },
    });
    
    const leadData = createLeadSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    logger.info('Lead data validated, userId:', userId);
    
    // Clean up empty strings to null/undefined for optional fields
    const cleanedData: any = {
      ...leadData,
      company: leadData.company || undefined,
      email: leadData.email || undefined,
      phone: leadData.phone || undefined,
      stage: leadData.stage || undefined,
      project_type: leadData.project_type || undefined,
      deadline: leadData.deadline || undefined,
      notes: leadData.notes || undefined,
      // assigned_to should be null if empty string or undefined (nullable field)
      assigned_to: (leadData.assigned_to && typeof leadData.assigned_to === 'string' && leadData.assigned_to.trim() !== '') 
        ? leadData.assigned_to.trim() 
        : null,
    };
    
    logger.info('Cleaned lead data:', cleanedData);
    const lead = await CRMService.createLead(cleanedData, userId);
    logger.info('Lead created successfully:', lead.id);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error in POST /leads:', {
        errors: error.errors,
        receivedData: req.body,
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data', 
        details: error.errors,
        receivedData: req.body,
      });
    }
    logger.error('Error in POST /leads:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      receivedData: req.body,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create lead', 
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
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

/**
 * GET /api/crm/leads/:id/activities
 * Get activity timeline for a lead
 */
router.get('/leads/:id/activities', async (req, res) => {
  try {
    const activities = await CRMService.getLeadActivityTimeline(req.params.id);
    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error in GET /leads/:id/activities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lead activities' });
  }
});

/**
 * PUT /api/crm/leads/:id/status
 * Quick update lead status
 */
router.put('/leads/:id/status', requireSales, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const userId = (req as any).user.id;
    const lead = await CRMService.updateLeadStatus(req.params.id, status, userId);
    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error in PUT /leads/:id/status:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead status' });
  }
});

/**
 * POST /api/crm/leads/:id/convert-to-customer
 * Convert lead to customer
 */
router.post('/leads/:id/convert-to-customer', requireSales, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const customer = await CRMService.convertLeadToCustomer(req.params.id, userId);
    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error in POST /leads/:id/convert-to-customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to convert lead to customer';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Customer validation schema
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional().nullable(),
  email: z.union([
    z.string().email('Invalid email format'),
    z.literal(''),
    z.null()
  ]).optional().nullable(),
  phone: z.string().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
  gstin: z.string().optional().nullable().or(z.literal('')),
  pan: z.string().optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  lead_id: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/crm/customers
 * Get all customers with optional filters
 */
router.get('/customers', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };

    const result = await CRMService.getCustomers(filters);
    res.json({ success: true, data: result.data, count: result.count });
  } catch (error) {
    logger.error('Error in GET /customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/crm/customers/:id
 * Get customer by ID
 */
router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await CRMService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    logger.error('Error in GET /customers/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

/**
 * POST /api/crm/customers
 * Create new customer
 */
router.post('/customers', requireSales, async (req, res) => {
  try {
    const customerData = createCustomerSchema.parse(req.body);
    const userId = (req as any).user.id;
    
    const customer = await CRMService.createCustomer(customerData, userId);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in POST /customers:', error);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
});

/**
 * PUT /api/crm/customers/:id
 * Update customer
 */
router.put('/customers/:id', requireSales, async (req, res) => {
  try {
    const updates = createCustomerSchema.partial().parse(req.body);
    const userId = (req as any).user.id;
    
    const customer = await CRMService.updateCustomer(req.params.id, updates, userId);
    res.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
    }
    logger.error('Error in PUT /customers/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
});

/**
 * DELETE /api/crm/customers/:id
 * Delete customer
 */
router.delete('/customers/:id', requireSales, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    await CRMService.deleteCustomer(req.params.id, userId);
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    logger.error('Error in DELETE /customers/:id:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
});

export default router;
