import { supabase } from '../index.js';
import { logger } from '../utils/logger.js';

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  value: number;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  stage?: string;
  project_type?: string;
  deadline?: string;
  progress?: number;
  quality?: 'excellent' | 'good' | 'average' | 'poor';
  timeline?: 'on-track' | 'at-risk' | 'delayed';
  assigned_to?: string;
  created_by: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class CRMService {
  /**
   * Get all leads with filters
   */
  static async getLeads(filters: {
    status?: string;
    assigned_to?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Lead[]; count: number }> {
    try {
      let query = supabase.from('leads').select('*', { count: 'exact' });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count: count || 0 };
    } catch (error) {
      logger.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get lead by ID
   */
  static async getLeadById(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching lead:', error);
      return null;
    }
  }

  /**
   * Create new lead
   */
  static async createLead(leadData: Partial<Lead>, userId: string): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...leadData,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity('leads', data.id, 'CREATE', 'Lead created', { lead: data }, userId);

      return data;
    } catch (error) {
      logger.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update lead
   */
  static async updateLead(id: string, updates: Partial<Lead>, userId: string): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity('leads', id, 'UPDATE', 'Lead updated', { updates }, userId);

      return data;
    } catch (error) {
      logger.error('Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Delete lead
   */
  static async deleteLead(id: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await this.logActivity('leads', id, 'DELETE', 'Lead deleted', {}, userId);
    } catch (error) {
      logger.error('Error deleting lead:', error);
      throw error;
    }
  }

  /**
   * Get tasks
   */
  static async getTasks(filters: {
    assigned_to?: string;
    linked_lead_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; count: number }> {
    try {
      let query = supabase.from('tasks').select('*', { count: 'exact' });

      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters.linked_lead_id) {
        query = query.eq('linked_lead_id', filters.linked_lead_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count: count || 0 };
    } catch (error) {
      logger.error('Error fetching tasks:', error);
      throw error;
    }
  }

  /**
   * Create task
   */
  static async createTask(taskData: any, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity('tasks', data.id, 'CREATE', 'Task created', { task: data }, userId);

      return data;
    } catch (error) {
      logger.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Get followups
   */
  static async getFollowups(filters: {
    lead_id?: string;
    customer_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; count: number }> {
    try {
      let query = supabase.from('followups').select('*', { count: 'exact' });

      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }

      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      query = query.order('scheduled_at', { ascending: true });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count: count || 0 };
    } catch (error) {
      logger.error('Error fetching followups:', error);
      throw error;
    }
  }

  /**
   * Create followup
   */
  static async createFollowup(followupData: any, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('followups')
        .insert({
          ...followupData,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error creating followup:', error);
      throw error;
    }
  }

  /**
   * Get activity logs
   */
  static async getActivityLogs(filters: {
    entity_type?: string;
    entity_id?: string;
    user_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; count: number }> {
    try {
      let query = supabase.from('activity_logs').select('*', { count: 'exact' });

      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }

      if (filters.entity_id) {
        query = query.eq('entity_id', filters.entity_id);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count: count || 0 };
    } catch (error) {
      logger.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  /**
   * Log activity
   */
  private static async logActivity(
    entityType: string,
    entityId: string,
    action: string,
    description: string,
    metadata: any,
    userId: string
  ): Promise<void> {
    try {
      await supabase.from('activity_logs').insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        description,
        metadata,
        user_id: userId,
      });
    } catch (error) {
      logger.error('Error logging activity:', error);
    }
  }
}
