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
  // New enhanced fields
  source?: string;
  probability?: number;
  expected_close_date?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  tags?: string[];
  lead_score?: number;
  last_activity_at?: string;
}

interface WebsiteLead {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone?: string | null;
  field?: string | null;
  lead_sources?: string[] | null;
  interests?: string[] | null;
  estimated_budget?: string | null;
  project_details: string;
  agreed_to_terms?: boolean;
  source?: string | null;
  user_agent?: string | null;
  client_ip?: string | null;
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
      logger.info('CRMService.getLeads - Fetching leads with filters:', filters);

      // Keep website contact submissions visible in CRM by syncing them into leads.
      await this.syncWebsiteLeadsToLeads();
      
      // First, get the leads
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

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

      const { data: leads, error, count } = await query;

      if (error) {
        logger.error('CRMService.getLeads - Supabase error:', error);
        throw error;
      }

      logger.info(`CRMService.getLeads - Found ${leads?.length || 0} leads`);

      // Get unique assigned user IDs
      const assignedUserIds = [...new Set((leads || [])
        .map((lead: any) => lead.assigned_to)
        .filter((id: any) => id !== null && id !== undefined))];

      // Fetch user names for assigned users
      let userNames: { [key: string]: string } = {};
      if (assignedUserIds.length > 0) {
        try {
          const { data: users, error: usersError } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .in('id', assignedUserIds);

          if (!usersError && users) {
            userNames = users.reduce((acc: any, user: any) => {
              acc[user.id] = user.full_name || user.email || 'Unknown';
              return acc;
            }, {});
            logger.info(`CRMService.getLeads - Fetched ${users.length} user names`);
          } else if (usersError) {
            logger.warn('CRMService.getLeads - Error fetching user names:', usersError);
          }
        } catch (userError) {
          logger.warn('CRMService.getLeads - Failed to fetch user names:', userError);
          // Don't fail the whole query if user names fail
        }
      }

      // Map the data to include assigned user name
      const mappedData = (leads || []).map((lead: any) => ({
        ...lead,
        assigned_to_name: lead.assigned_to ? (userNames[lead.assigned_to] || null) : null,
      }));

      logger.info(`CRMService.getLeads - Returning ${mappedData.length} mapped leads`);
      return { data: mappedData, count: count || 0 };
    } catch (error) {
      logger.error('CRMService.getLeads - Error fetching leads:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        filters,
      });
      throw error;
    }
  }

  /**
   * Sync website contact-form submissions into CRM leads.
   * Uses website_leads.id as leads.id to keep imports idempotent.
   */
  private static async syncWebsiteLeadsToLeads(): Promise<void> {
    try {
      const { data: websiteLeads, error: websiteLeadsError } = await supabase
        .from('website_leads')
        .select(`
          id,
          created_at,
          updated_at,
          name,
          email,
          phone,
          field,
          lead_sources,
          interests,
          estimated_budget,
          project_details,
          agreed_to_terms,
          source,
          user_agent,
          client_ip
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (websiteLeadsError) {
        const pgCode = (websiteLeadsError as any)?.code;
        if (pgCode === '42P01') {
          logger.warn('CRMService.syncWebsiteLeadsToLeads - website_leads table missing; skipping sync');
          return;
        }
        throw websiteLeadsError;
      }

      const rows = (websiteLeads || []) as WebsiteLead[];
      if (rows.length === 0) {
        logger.info('CRMService.syncWebsiteLeadsToLeads - No website leads to sync');
        return;
      }

      const websiteLeadIds = rows.map((row) => row.id);
      let supportsSourceColumn = true;
      let { data: existingLeads, error: existingLeadsError }: { data: any[] | null; error: any } = await supabase
        .from('leads')
        .select('id, source, status, assigned_to, updated_at, notes, tags')
        .in('id', websiteLeadIds);

      if (existingLeadsError && this.isMissingColumnError(existingLeadsError)) {
        supportsSourceColumn = false;
        logger.warn('CRMService.syncWebsiteLeadsToLeads - leads.source missing, using compatibility mode', this.getDbErrorMeta(existingLeadsError));
        const fallbackQuery = await supabase
          .from('leads')
          .select('id, status, assigned_to, updated_at, notes, tags')
          .in('id', websiteLeadIds);
        existingLeads = fallbackQuery.data;
        existingLeadsError = fallbackQuery.error;
      }

      if (existingLeadsError) {
        logger.error('CRMService.syncWebsiteLeadsToLeads - Failed reading existing leads', this.getDbErrorMeta(existingLeadsError));
        throw existingLeadsError;
      }

      const existingById = new Map((existingLeads || []).map((lead: any) => [lead.id, lead]));

      const rowsToInsert = rows
        .filter((row) => !existingById.has(row.id))
        .map((row) => this.toWebsiteLeadInsertPayload(row));

      let insertedCount = 0;
      let skippedCount = 0;
      let fallbackRetryCount = 0;
      if (rowsToInsert.length > 0) {
        const insertResult = await this.insertLeadsWithSchemaFallback(rowsToInsert, ['source', 'project_type'], supportsSourceColumn);
        fallbackRetryCount += insertResult.retries;
        if (insertResult.error) {
          logger.error('CRMService.syncWebsiteLeadsToLeads - Insert failed after fallback', {
            ...this.getDbErrorMeta(insertResult.error),
            payload_keys: Object.keys(rowsToInsert[0] || {}),
          });
          throw insertResult.error;
        }
        insertedCount = rowsToInsert.length;
      }

      // Keep website-origin leads fresh, but never reset already-processed leads.
      // We only sync updates while lead is still unassigned and in "new" status.
      let updatedCount = 0;
      for (const row of rows) {
        const existingLead: any = existingById.get(row.id);
        if (!existingLead) {
          continue;
        }

        const sourceValue = (existingLead.source || '').toLowerCase();
        const notesValue = (existingLead.notes || '').toLowerCase();
        const isWebsiteLead = supportsSourceColumn
          ? sourceValue === 'website' || notesValue.includes('source: website')
          : true;
        const isUnprocessed = existingLead.status === 'new' && !existingLead.assigned_to;
        if (!isWebsiteLead || !isUnprocessed) {
          skippedCount += 1;
          continue;
        }

        const websiteUpdatedAt = new Date(row.updated_at).getTime();
        const leadUpdatedAt = new Date(existingLead.updated_at).getTime();
        const shouldBackfillInterests =
          Array.isArray(row.interests) &&
          row.interests.length > 0 &&
          (!Array.isArray(existingLead.tags) || existingLead.tags.length === 0);
        if (
          !Number.isFinite(websiteUpdatedAt) ||
          !Number.isFinite(leadUpdatedAt) ||
          (websiteUpdatedAt <= leadUpdatedAt && !shouldBackfillInterests)
        ) {
          continue;
        }

        const { error: updateError } = await supabase
          .from('leads')
          .update(this.toWebsiteLeadUpdatePayload(row))
          .eq('id', row.id);

        if (updateError && this.isMissingColumnError(updateError)) {
          fallbackRetryCount += 1;
          const fallbackUpdate = this.stripPayloadColumns(this.toWebsiteLeadUpdatePayload(row), ['source', 'project_type']);
          const { error: retryError } = await supabase
            .from('leads')
            .update(fallbackUpdate)
            .eq('id', row.id);
          if (!retryError) {
            updatedCount += 1;
          } else {
            logger.warn('CRMService.syncWebsiteLeadsToLeads - Update fallback failed', this.getDbErrorMeta(retryError));
          }
          continue;
        }

        if (!updateError) {
          updatedCount += 1;
        } else {
          logger.warn('CRMService.syncWebsiteLeadsToLeads - Update failed', this.getDbErrorMeta(updateError));
        }
      }

      logger.info('CRMService.syncWebsiteLeadsToLeads - Sync summary', {
        fetched: rows.length,
        existing: existingById.size,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        fallback_retries: fallbackRetryCount,
        compatibility_mode: !supportsSourceColumn,
      });
    } catch (error) {
      // Never block lead listing because of sync issues.
      logger.warn('CRMService.syncWebsiteLeadsToLeads - Non-fatal sync failure:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(error ? this.getDbErrorMeta(error) : {}),
      });
    }
  }

  private static buildWebsiteLeadNotes(lead: WebsiteLead): string {
    const lines: string[] = [];
    lines.push('Source: Website');

    if (lead.project_details?.trim()) {
      lines.push(`Project details: ${lead.project_details.trim()}`);
    }
    if (lead.estimated_budget?.trim()) {
      lines.push(`Estimated budget: ${lead.estimated_budget.trim()}`);
    }
    if (Array.isArray(lead.lead_sources) && lead.lead_sources.length > 0) {
      lines.push(`Lead sources: ${lead.lead_sources.filter(Boolean).join(', ')}`);
    }
    if (Array.isArray(lead.interests) && lead.interests.length > 0) {
      lines.push(`Interests: ${lead.interests.filter(Boolean).join(', ')}`);
    }

    lines.push(`Agreed to terms: ${lead.agreed_to_terms ? 'Yes' : 'No'}`);

    if (lead.user_agent?.trim()) {
      lines.push(`User agent: ${lead.user_agent.trim()}`);
    }
    if (lead.client_ip?.trim()) {
      lines.push(`Client IP: ${lead.client_ip.trim()}`);
    }

    return lines.join('\n');
  }

  private static toWebsiteLeadInsertPayload(row: WebsiteLead): Record<string, any> {
    return {
      id: row.id,
      name: row.name?.trim() || 'Website Lead',
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      value: 0,
      status: 'new',
      source: 'Website',
      project_type: row.field?.trim() || null,
      tags: Array.isArray(row.interests) ? row.interests.filter(Boolean) : [],
      notes: this.buildWebsiteLeadNotes(row),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private static toWebsiteLeadUpdatePayload(row: WebsiteLead): Record<string, any> {
    return {
      name: row.name?.trim() || 'Website Lead',
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      source: 'Website',
      project_type: row.field?.trim() || null,
      tags: Array.isArray(row.interests) ? row.interests.filter(Boolean) : [],
      notes: this.buildWebsiteLeadNotes(row),
      updated_at: row.updated_at,
    };
  }

  private static stripPayloadColumns(payload: Record<string, any>, columnsToDrop: string[]): Record<string, any> {
    return Object.fromEntries(Object.entries(payload).filter(([key]) => !columnsToDrop.includes(key)));
  }

  private static async insertLeadsWithSchemaFallback(
    rows: Record<string, any>[],
    optionalColumns: string[],
    supportsSourceColumn: boolean
  ): Promise<{ error: any | null; retries: number }> {
    let retries = 0;
    let payload = supportsSourceColumn ? rows : rows.map((row) => this.stripPayloadColumns(row, ['source']));
    const columnsToTry = supportsSourceColumn ? [...optionalColumns] : optionalColumns.filter((col) => col !== 'source');

    for (let i = 0; i <= columnsToTry.length; i++) {
      const { error } = await supabase.from('leads').insert(payload);
      if (!error) {
        return { error: null, retries };
      }

      if (!this.isMissingColumnError(error) || i === columnsToTry.length) {
        return { error, retries };
      }

      retries += 1;
      const column = columnsToTry[i];
      payload = payload.map((row) => this.stripPayloadColumns(row, [column]));
      logger.warn('CRMService.syncWebsiteLeadsToLeads - Retrying insert without optional column', {
        column,
        retry: retries,
        ...this.getDbErrorMeta(error),
      });
    }

    return { error: null, retries };
  }

  private static isMissingColumnError(error: any): boolean {
    const message = (error?.message || '').toLowerCase();
    return error?.code === '42703' || message.includes('column') && message.includes('does not exist');
  }

  private static getDbErrorMeta(error: any): Record<string, any> {
    return {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    };
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
      logger.info('CRMService.createLead - Starting lead creation:', {
        leadData,
        userId,
        dataKeys: Object.keys(leadData),
        dataTypes: Object.entries(leadData).reduce((acc, [key, value]) => {
          acc[key] = typeof value;
          return acc;
        }, {} as any),
      });

      // Ensure required fields are present
      if (!leadData.name || leadData.name.trim() === '') {
        throw new Error('Lead name is required');
      }

      // Prepare insert data - ensure proper types and remove undefined values
      const insertData: any = {
        name: leadData.name.trim(),
        value: leadData.value || 0,
        status: leadData.status || 'new',
        created_by: userId,
      };

      // Add optional fields only if they have values
      if (leadData.company && leadData.company.trim() !== '') {
        insertData.company = leadData.company.trim();
      }
      if (leadData.email && leadData.email.trim() !== '') {
        insertData.email = leadData.email.trim();
      }
      if (leadData.phone && leadData.phone.trim() !== '') {
        insertData.phone = leadData.phone.trim();
      }
      if (leadData.stage && leadData.stage.trim() !== '') {
        insertData.stage = leadData.stage.trim();
      }
      if (leadData.project_type && leadData.project_type.trim() !== '') {
        insertData.project_type = leadData.project_type.trim();
      }
      if (leadData.deadline) {
        insertData.deadline = leadData.deadline;
      }
      if (leadData.notes && leadData.notes.trim() !== '') {
        insertData.notes = leadData.notes.trim();
      }
      // assigned_to can be null (nullable field)
      if (leadData.assigned_to && typeof leadData.assigned_to === 'string' && leadData.assigned_to.trim() !== '') {
        insertData.assigned_to = leadData.assigned_to.trim();
      } else {
        insertData.assigned_to = null;
      }
      // Add new enhanced fields
      if (leadData.source && leadData.source.trim() !== '') {
        insertData.source = leadData.source.trim();
      }
      if (leadData.probability !== undefined && leadData.probability !== null) {
        insertData.probability = Math.max(0, Math.min(100, leadData.probability));
      }
      if (leadData.expected_close_date) {
        insertData.expected_close_date = leadData.expected_close_date;
      }
      if (leadData.industry && leadData.industry.trim() !== '') {
        insertData.industry = leadData.industry.trim();
      }
      if (leadData.company_size && leadData.company_size.trim() !== '') {
        insertData.company_size = leadData.company_size.trim();
      }
      if (leadData.location && leadData.location.trim() !== '') {
        insertData.location = leadData.location.trim();
      }
      if (leadData.tags && Array.isArray(leadData.tags)) {
        insertData.tags = leadData.tags.filter(tag => tag && tag.trim() !== '');
      }
      if (leadData.lead_score !== undefined && leadData.lead_score !== null) {
        insertData.lead_score = leadData.lead_score;
      }

      logger.info('CRMService.createLead - Prepared insert data:', insertData);

      const { data, error } = await supabase
        .from('leads')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('CRMService.createLead - Supabase error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          insertData: JSON.stringify(insertData, null, 2),
        });
        throw error;
      }

      if (!data) {
        logger.error('CRMService.createLead - No data returned from insert');
        throw new Error('Failed to create lead - no data returned');
      }

      logger.info('CRMService.createLead - Lead created successfully:', {
        id: data.id,
        name: data.name,
        status: data.status,
      });

      // Log activity (non-blocking)
      try {
        await this.logActivity('leads', data.id, 'CREATE', 'Lead created', { lead: data }, userId);
      } catch (activityError) {
        logger.warn('CRMService.createLead - Failed to log activity (non-critical):', activityError);
      }

      return data;
    } catch (error) {
      logger.error('CRMService.createLead - Error creating lead:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        leadData: JSON.stringify(leadData, null, 2),
        userId,
      });
      throw error;
    }
  }

  /**
   * Update lead
   */
  static async updateLead(id: string, updates: Partial<Lead>, userId: string): Promise<Lead> {
    try {
      // Clean up updates similar to createLead
      const cleanedUpdates: any = { ...updates };
      
      // Handle status change - update last_activity_at
      if (updates.status) {
        cleanedUpdates.last_activity_at = new Date().toISOString();
      }
      
      // Clean string fields
      if (cleanedUpdates.source !== undefined) {
        cleanedUpdates.source = cleanedUpdates.source && cleanedUpdates.source.trim() !== '' 
          ? cleanedUpdates.source.trim() 
          : null;
      }
      if (cleanedUpdates.industry !== undefined) {
        cleanedUpdates.industry = cleanedUpdates.industry && cleanedUpdates.industry.trim() !== '' 
          ? cleanedUpdates.industry.trim() 
          : null;
      }
      if (cleanedUpdates.company_size !== undefined) {
        cleanedUpdates.company_size = cleanedUpdates.company_size && cleanedUpdates.company_size.trim() !== '' 
          ? cleanedUpdates.company_size.trim() 
          : null;
      }
      if (cleanedUpdates.location !== undefined) {
        cleanedUpdates.location = cleanedUpdates.location && cleanedUpdates.location.trim() !== '' 
          ? cleanedUpdates.location.trim() 
          : null;
      }
      if (cleanedUpdates.probability !== undefined && cleanedUpdates.probability !== null) {
        cleanedUpdates.probability = Math.max(0, Math.min(100, cleanedUpdates.probability));
      }
      if (cleanedUpdates.tags !== undefined && Array.isArray(cleanedUpdates.tags)) {
        cleanedUpdates.tags = cleanedUpdates.tags.filter((tag: string) => tag && tag.trim() !== '');
      }

      const { data, error } = await supabase
        .from('leads')
        .update(cleanedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity - include status change if applicable
      const description = updates.status 
        ? `Lead status changed to ${updates.status}` 
        : 'Lead updated';
      await this.logActivity('leads', id, 'UPDATE', description, { updates: cleanedUpdates }, userId);

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
   * Get all customers with filters
   */
  static async getCustomers(filters: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; count: number }> {
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' });

      if (filters.status) {
        query = query.eq('status', filters.status);
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
      logger.error('Error fetching customers:', error);
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomerById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching customer:', error);
      return null;
    }
  }

  /**
   * Create customer
   */
  static async createCustomer(customerData: any, userId: string): Promise<any> {
    try {
      if (!customerData.name || customerData.name.trim() === '') {
        throw new Error('Customer name is required');
      }

      const insertData: any = {
        name: customerData.name.trim(),
        status: customerData.status || 'active',
      };

      if (customerData.company && customerData.company.trim() !== '') {
        insertData.company = customerData.company.trim();
      }
      if (customerData.email && customerData.email.trim() !== '') {
        insertData.email = customerData.email.trim();
      }
      if (customerData.phone && customerData.phone.trim() !== '') {
        insertData.phone = customerData.phone.trim();
      }
      if (customerData.address && customerData.address.trim() !== '') {
        insertData.address = customerData.address.trim();
      }
      if (customerData.gstin && customerData.gstin.trim() !== '') {
        insertData.gstin = customerData.gstin.trim();
      }
      if (customerData.pan && customerData.pan.trim() !== '') {
        insertData.pan = customerData.pan.trim();
      }
      if (customerData.lead_id) {
        insertData.lead_id = customerData.lead_id;
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity('customers', data.id, 'CREATE', 'Customer created', { customer: data }, userId);

      return data;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(id: string, updates: any, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity('customers', id, 'UPDATE', 'Customer updated', { updates }, userId);

      return data;
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete customer
   */
  static async deleteCustomer(id: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await this.logActivity('customers', id, 'DELETE', 'Customer deleted', {}, userId);
    } catch (error) {
      logger.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Convert lead to customer
   */
  static async convertLeadToCustomer(leadId: string, userId: string): Promise<any> {
    try {
      // Get the lead
      const lead = await this.getLeadById(leadId);
      if (!lead) {
        throw new Error('Lead not found');
      }

      // Check if customer already exists for this lead
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (existingCustomer) {
        throw new Error('Customer already exists for this lead');
      }

      // Create customer from lead data
      const customerData = {
        lead_id: leadId,
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        status: 'active',
      };

      const customer = await this.createCustomer(customerData, userId);

      // Update lead status to 'won' if not already
      if (lead.status !== 'won') {
        await this.updateLead(leadId, { status: 'won' }, userId);
      }

      // Log activity
      await this.logActivity('leads', leadId, 'UPDATE', 'Lead converted to customer', { customer_id: customer.id }, userId);

      return customer;
    } catch (error) {
      logger.error('Error converting lead to customer:', error);
      throw error;
    }
  }

  /**
   * Update lead status (quick update)
   */
  static async updateLeadStatus(id: string, status: string, userId: string): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ 
          status,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity('leads', id, 'UPDATE', `Lead status changed to ${status}`, { status }, userId);

      return data;
    } catch (error) {
      logger.error('Error updating lead status:', error);
      throw error;
    }
  }

  /**
   * Get activity timeline for a lead
   */
  static async getLeadActivityTimeline(leadId: string): Promise<any[]> {
    try {
      const result = await this.getActivityLogs({
        entity_type: 'leads',
        entity_id: leadId,
        limit: 50,
      });

      // Fetch user names for activities
      const userIds = [...new Set(result.data.map((activity: any) => activity.user_id).filter(Boolean))];
      let userNames: { [key: string]: string } = {};
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        if (users) {
          userNames = users.reduce((acc: any, user: any) => {
            acc[user.id] = user.full_name || user.email || 'Unknown';
            return acc;
          }, {});
        }
      }

      // Map activities with user names
      return result.data.map((activity: any) => ({
        ...activity,
        user_name: activity.user_id ? (userNames[activity.user_id] || 'Unknown') : 'System',
      }));
    } catch (error) {
      logger.error('Error fetching lead activity timeline:', error);
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
