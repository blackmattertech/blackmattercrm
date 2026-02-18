import React, { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Currency,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  Target,
  TrendingUp,
  ArrowLeft,
  Download,
  GripVertical
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { formatINR, formatINRCompact, formatDate } from "../utils/formatters";
import { MetricCard } from "../components/MetricCard";
import { crmApi, usersApi } from "../../lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Papa from "papaparse";

interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  value: number;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  stage?: string;
  lastContact?: string;
  assignedTo?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  projectType?: string;
  project_type?: string;
  deadline?: string;
  progress?: number;
  quality?: "excellent" | "good" | "average" | "poor";
  timeline?: "on-track" | "at-risk" | "delayed";
  notes?: string;
  created_at?: string;
  updated_at?: string;
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

interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  status: "active" | "inactive" | "archived";
  lead_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProjectDetail {
  description: string;
  requirements: string[];
  attachments: { name: string; type: "file" | "image" | "link"; url: string }[];
  timeline: string;
  budget: number;
  milestones: { name: string; status: string; dueDate: string }[];
  teamMembers: string[];
}

interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  linkedLead?: number;
  linkedLeadName?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  progress: number;
}

export function CRM() {
  const [view, setView] = useState<"list" | "kanban" | "projects" | "customers">("list");
  const [currentPage, setCurrentPage] = useState<"main" | "detail" | "create-lead" | "create-task" | "edit-lead">("main");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Form state for creating/editing lead
  const [leadForm, setLeadForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    value: 0,
    status: "new" as Lead["status"],
    stage: "",
    notes: "",
    assigned_to: "",
    source: "",
    probability: 0,
    expected_close_date: "",
    industry: "",
    company_size: "",
    location: "",
    tags: [] as string[],
  });
  const [creatingLead, setCreatingLead] = useState(false);
  const [editingLead, setEditingLead] = useState(false);
  
  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
    pan: "",
    status: "active" as Customer["status"],
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  
  // Follow-up form state
  const [followupForm, setFollowupForm] = useState({
    type: "call" as "call" | "email" | "meeting" | "note" | "other",
    scheduled_at: "",
    notes: "",
  });
  const [creatingFollowup, setCreatingFollowup] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: [] as string[],
    assigned_to: [] as string[],
    source: [] as string[],
    search: "",
  });

  // Load leads on mount
  useEffect(() => {
    loadLeads();
    loadTeams();
    if (view === "customers") {
      loadCustomers();
    }
  }, [view]);

  // Reload teams when create modal opens to ensure fresh data
  useEffect(() => {
    if (showCreateModal && teams.length === 0 && !teamsLoading) {
      loadTeams();
    }
  }, [showCreateModal]);

  // Load activities when lead detail modal opens
  useEffect(() => {
    if (showDetailModal && selectedLead) {
      loadLeadActivities(selectedLead.id);
      loadLeadFollowups(selectedLead.id);
    }
  }, [showDetailModal, selectedLead]);

  const loadLeads = async () => {
    setLeadsLoading(true);
    try {
      console.log('[CRM] Loading leads...');
      const response = await crmApi.getLeads();
      console.log('[CRM] Load leads response:', response);
      
      if (response.success && response.data) {
        const leadsArray = Array.isArray(response.data) ? response.data : [];
        console.log(`[CRM] Received ${leadsArray.length} leads`);
        // Map database leads to frontend format
        const mappedLeads = leadsArray.map((lead: any) => ({
          ...lead,
          assignedTo: lead.assigned_to_name || lead.assigned_to || "",
          lastContact: lead.updated_at || lead.created_at,
          projectType: lead.project_type,
        }));
        console.log('[CRM] Mapped leads:', mappedLeads);
        setLeads(mappedLeads);
        console.log('[CRM] Leads state updated');
      } else {
        console.warn('[CRM] Load leads response not successful:', response);
        setLeads([]);
      }
    } catch (error) {
      console.error('[CRM] Failed to load leads:', error);
      toast.error('Failed to load leads');
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadTeams = async () => {
    setTeamsLoading(true);
    try {
      const response = await usersApi.getAllUsers();
      if (response.success && response.data) {
        // Filter only active and approved users from database
        const activeUsers = response.data.filter((user: any) => 
          user.is_active && user.approval_status === 'approved'
        );
        console.log('[CRM] Loaded teams from database:', activeUsers.length, 'users');
        setTeams(activeUsers);
      } else {
        console.error('[CRM] Failed to load teams:', response.error);
        setTeams([]); // Ensure teams is empty array, not undefined
      }
    } catch (error) {
      console.error('[CRM] Failed to load teams:', error);
      setTeams([]); // Ensure teams is empty array on error
    } finally {
      setTeamsLoading(false);
    }
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await crmApi.getCustomers();
      if (response.success && response.data) {
        setCustomers(Array.isArray(response.data) ? response.data : []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('[CRM] Failed to load customers:', error);
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadLeadActivities = async (leadId: string) => {
    try {
      const response = await crmApi.getLeadActivities(leadId);
      if (response.success && response.data) {
        setActivities(Array.isArray(response.data) ? response.data : []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('[CRM] Failed to load activities:', error);
      setActivities([]);
    }
  };

  const loadLeadFollowups = async (leadId: string) => {
    try {
      const response = await crmApi.getFollowups({ lead_id: leadId });
      if (response.success && response.data) {
        setFollowups(Array.isArray(response.data) ? response.data : []);
      } else {
        setFollowups([]);
      }
    } catch (error) {
      console.error('[CRM] Failed to load followups:', error);
      setFollowups([]);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: Lead["status"]) => {
    setUpdatingStatus(leadId);
    try {
      const response = await crmApi.updateLeadStatus(leadId, newStatus);
      if (response.success) {
        toast.success('Lead status updated');
        // Update local state
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === leadId ? { ...lead, status: newStatus } : lead
          )
        );
        // Update selected lead if it's the same
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      } else {
        toast.error(response.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('[CRM] Failed to update lead status:', error);
      toast.error(error?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setLeadForm({
      name: lead.name || "",
      company: lead.company || "",
      email: lead.email || "",
      phone: lead.phone || "",
      value: lead.value || 0,
      status: lead.status,
      stage: lead.stage || "",
      notes: lead.notes || "",
      assigned_to: lead.assigned_to || "",
      source: lead.source || "",
      probability: lead.probability || 0,
      expected_close_date: lead.expected_close_date || "",
      industry: lead.industry || "",
      company_size: lead.company_size || "",
      location: lead.location || "",
      tags: lead.tags || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    
    if (!leadForm.name || leadForm.name.trim() === '') {
      toast.error("Name is required");
      return;
    }

    setEditingLead(true);
    try {
      const leadData = {
        name: leadForm.name.trim(),
        company: leadForm.company?.trim() || undefined,
        email: leadForm.email?.trim() || undefined,
        phone: leadForm.phone?.trim() || undefined,
        value: leadForm.value || 0,
        status: leadForm.status,
        stage: leadForm.stage?.trim() || undefined,
        notes: leadForm.notes?.trim() || undefined,
        assigned_to: leadForm.assigned_to && leadForm.assigned_to.trim() !== '' 
          ? leadForm.assigned_to.trim() 
          : null,
        source: leadForm.source?.trim() || undefined,
        probability: leadForm.probability || undefined,
        expected_close_date: leadForm.expected_close_date || undefined,
        industry: leadForm.industry?.trim() || undefined,
        company_size: leadForm.company_size?.trim() || undefined,
        location: leadForm.location?.trim() || undefined,
        tags: leadForm.tags.length > 0 ? leadForm.tags : undefined,
      };

      const response = await crmApi.updateLead(selectedLead.id, leadData);
      if (response.success && response.data) {
        toast.success("Lead updated successfully!");
        setShowEditModal(false);
        loadLeads();
        if (selectedLead.id === response.data.id) {
          setSelectedLead(response.data);
        }
      } else {
        toast.error(response.error || "Failed to update lead");
      }
    } catch (error: any) {
      console.error('[CRM] Update lead exception:', error);
      toast.error(error?.message || "Failed to update lead");
    } finally {
      setEditingLead(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await crmApi.deleteLead(leadId);
      if (response.success) {
        toast.success("Lead deleted successfully");
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
        if (selectedLead && selectedLead.id === leadId) {
          setShowDetailModal(false);
          setSelectedLead(null);
        }
      } else {
        toast.error(response.error || "Failed to delete lead");
      }
    } catch (error: any) {
      console.error('[CRM] Delete lead exception:', error);
      toast.error(error?.message || "Failed to delete lead");
    }
  };

  const handleConvertToCustomer = async (leadId: string) => {
    try {
      const response = await crmApi.convertLeadToCustomer(leadId);
      if (response.success) {
        toast.success("Lead converted to customer successfully!");
        loadLeads();
        if (view === "customers") {
          loadCustomers();
        }
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, status: "won" });
        }
      } else {
        toast.error(response.error || "Failed to convert lead to customer");
      }
    } catch (error: any) {
      console.error('[CRM] Convert to customer exception:', error);
      toast.error(error?.message || "Failed to convert lead to customer");
    }
  };

  const handleCreateFollowup = async () => {
    if (!selectedLead) return;
    
    if (!followupForm.scheduled_at) {
      toast.error("Scheduled date is required");
      return;
    }

    setCreatingFollowup(true);
    try {
      const response = await crmApi.createFollowup({
        lead_id: selectedLead.id,
        type: followupForm.type,
        scheduled_at: followupForm.scheduled_at,
        notes: followupForm.notes || undefined,
      });
      if (response.success) {
        toast.success("Follow-up scheduled successfully!");
        setFollowupForm({
          type: "call",
          scheduled_at: "",
          notes: "",
        });
        setShowFollowupModal(false);
        loadLeadFollowups(selectedLead.id);
        loadLeadActivities(selectedLead.id);
      } else {
        toast.error(response.error || "Failed to schedule follow-up");
      }
    } catch (error: any) {
      console.error('[CRM] Create followup exception:', error);
      toast.error(error?.message || "Failed to schedule follow-up");
    } finally {
      setCreatingFollowup(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name || customerForm.name.trim() === '') {
      toast.error("Name is required");
      return;
    }

    setCreatingCustomer(true);
    try {
      const customerData = {
        name: customerForm.name.trim(),
        company: customerForm.company?.trim() || undefined,
        email: customerForm.email?.trim() || undefined,
        phone: customerForm.phone?.trim() || undefined,
        address: customerForm.address?.trim() || undefined,
        gstin: customerForm.gstin?.trim() || undefined,
        pan: customerForm.pan?.trim() || undefined,
        status: customerForm.status,
      };

      const response = await crmApi.createCustomer(customerData);
      if (response.success && response.data) {
        toast.success("Customer created successfully!");
        setCustomerForm({
          name: "",
          company: "",
          email: "",
          phone: "",
          address: "",
          gstin: "",
          pan: "",
          status: "active",
        });
        setShowCustomerModal(false);
        loadCustomers();
      } else {
        toast.error(response.error || "Failed to create customer");
      }
    } catch (error: any) {
      console.error('[CRM] Create customer exception:', error);
      toast.error(error?.message || "Failed to create customer");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleExportLeads = () => {
    try {
      const csvData = leads.map(lead => ({
        Name: lead.name,
        Company: lead.company || '',
        Email: lead.email || '',
        Phone: lead.phone || '',
        Value: lead.value,
        Status: lead.status,
        Stage: lead.stage || '',
        Source: lead.source || '',
        Probability: lead.probability || 0,
        'Expected Close Date': lead.expected_close_date || '',
        Industry: lead.industry || '',
        'Company Size': lead.company_size || '',
        Location: lead.location || '',
        Assigned: lead.assigned_to_name || 'Unassigned',
        'Created At': lead.created_at || '',
        Notes: lead.notes || '',
      }));
      
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Leads exported successfully');
    } catch (error) {
      console.error('[CRM] Export error:', error);
      toast.error('Failed to export leads');
    }
  };

  const handleCreateLead = async () => {
    console.log('[CRM] handleCreateLead called');
    
    if (!leadForm.name || leadForm.name.trim() === '') {
      console.warn('[CRM] Validation failed: Name is required');
      toast.error("Name is required");
      return;
    }

    console.log('[CRM] Validation passed, starting lead creation');
    setCreatingLead(true);
    try {
      // Clean up empty strings - convert to null/undefined for optional fields
      const leadData = {
        name: leadForm.name.trim(),
        company: leadForm.company?.trim() || undefined,
        email: leadForm.email?.trim() || undefined,
        phone: leadForm.phone?.trim() || undefined,
        value: leadForm.value || 0,
        status: leadForm.status,
        stage: leadForm.stage?.trim() || undefined,
        notes: leadForm.notes?.trim() || undefined,
        // Convert empty string to null for assigned_to (nullable field)
        assigned_to: leadForm.assigned_to && leadForm.assigned_to.trim() !== '' 
          ? leadForm.assigned_to.trim() 
          : null,
        // New enhanced fields
        source: leadForm.source?.trim() || undefined,
        probability: leadForm.probability || undefined,
        expected_close_date: leadForm.expected_close_date || undefined,
        industry: leadForm.industry?.trim() || undefined,
        company_size: leadForm.company_size?.trim() || undefined,
        location: leadForm.location?.trim() || undefined,
        tags: leadForm.tags.length > 0 ? leadForm.tags : undefined,
      };

      console.log('[CRM] Creating lead with data:', leadData);
      console.log('[CRM] Lead data JSON:', JSON.stringify(leadData, null, 2));
      console.log('[CRM] About to call crmApi.createLead...');
      
      const response = await crmApi.createLead(leadData);
      console.log('[CRM] API call completed, response received');
      console.log('[CRM] Create lead response:', response);
      console.log('[CRM] Response success:', response.success);
      console.log('[CRM] Response data:', response.data);
      console.log('[CRM] Response error:', response.error);
      
      if (response.success && response.data) {
        console.log('[CRM] Lead created successfully, ID:', response.data.id);
        toast.success("Lead created successfully!");
        
        // Reset form first
        setLeadForm({
          name: "",
          company: "",
          email: "",
          phone: "",
          value: 0,
          status: "new",
          stage: "",
          notes: "",
          assigned_to: "",
          source: "",
          probability: 0,
          expected_close_date: "",
          industry: "",
          company_size: "",
          location: "",
          tags: [],
        });
        
        // Close modal
        setShowCreateModal(false);
        
        // Add the new lead to the list immediately (optimistic update)
        const newLead: Lead = {
          ...response.data,
          assignedTo: response.data.assigned_to_name || response.data.assigned_to || "",
          lastContact: response.data.updated_at || response.data.created_at,
          projectType: response.data.project_type,
        };
        setLeads(prevLeads => [newLead, ...prevLeads]);
        console.log('[CRM] Added new lead to list immediately');
        
        // Also reload from server to ensure consistency
        setTimeout(() => {
          loadLeads().catch(err => {
            console.error('[CRM] Error reloading leads after creation:', err);
          });
        }, 500);
      } else {
        const errorMsg = response.error || response.message || "Failed to create lead";
        console.error('[CRM] Create lead failed:', {
          error: errorMsg,
          response: response,
          status: response.status,
          details: response.details,
        });
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error('[CRM] Create lead exception:', error);
      const errorMsg = error?.response?.data?.error || error?.message || error?.response?.data?.message || "Failed to create lead";
      console.error('[CRM] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      toast.error(errorMsg);
    } finally {
      setCreatingLead(false);
    }
  };

  const projectDetails: { [key: number]: ProjectDetail } = {
    1: {
      description: "Complete corporate website redesign with modern UI/UX, responsive design, and CMS integration.",
      requirements: [
        "Responsive design for all devices",
        "WordPress CMS integration",
        "Contact form with email notifications",
        "Blog section",
        "SEO optimization",
        "Performance optimization (load time < 2s)"
      ],
      attachments: [
        { name: "Brand Guidelines.pdf", type: "file", url: "#" },
        { name: "Logo Assets.zip", type: "file", url: "#" },
        { name: "Design Mockups", type: "image", url: "#" },
        { name: "Competitor Analysis", type: "link", url: "https://example.com" }
      ],
      timeline: "8 weeks",
      budget: 500000,
      milestones: [
        { name: "Design Approval", status: "completed", dueDate: "05/02/2024" },
        { name: "Development Phase 1", status: "in-progress", dueDate: "20/02/2024" },
        { name: "Testing & QA", status: "pending", dueDate: "05/03/2024" },
        { name: "Launch", status: "pending", dueDate: "15/03/2024" }
      ],
      teamMembers: [] // Will be populated from database
    },
    2: {
      description: "Native mobile application for iOS and Android with real-time features and offline support.",
      requirements: [
        "Native iOS and Android apps",
        "Real-time notifications",
        "Offline mode support",
        "User authentication",
        "Payment gateway integration",
        "Analytics dashboard"
      ],
      attachments: [
        { name: "App Requirements.docx", type: "file", url: "#" },
        { name: "Wireframes", type: "image", url: "#" },
        { name: "API Documentation", type: "link", url: "https://api-docs.example.com" }
      ],
      timeline: "12 weeks",
      budget: 350000,
      milestones: [
        { name: "UI/UX Design", status: "completed", dueDate: "10/02/2024" },
        { name: "Backend API", status: "in-progress", dueDate: "28/02/2024" },
        { name: "iOS Development", status: "in-progress", dueDate: "15/03/2024" },
        { name: "Android Development", status: "pending", dueDate: "25/03/2024" },
        { name: "Testing", status: "pending", dueDate: "10/04/2024" },
        { name: "App Store Release", status: "pending", dueDate: "20/04/2024" }
      ],
      teamMembers: [] // Will be populated from database
    },
    3: {
      description: "Full-featured e-commerce platform with inventory management, payment processing, and analytics.",
      requirements: [
        "Product catalog management",
        "Shopping cart and checkout",
        "Multiple payment gateways",
        "Inventory management",
        "Order tracking",
        "Admin dashboard",
        "Customer reviews and ratings",
        "Email notifications"
      ],
      attachments: [
        { name: "Product Specifications.pdf", type: "file", url: "#" },
        { name: "Database Schema", type: "file", url: "#" },
        { name: "Reference Sites", type: "link", url: "https://references.example.com" }
      ],
      timeline: "16 weeks",
      budget: 750000,
      milestones: [
        { name: "System Architecture", status: "completed", dueDate: "01/02/2024" },
        { name: "Database Design", status: "in-progress", dueDate: "15/02/2024" },
        { name: "Frontend Development", status: "pending", dueDate: "15/03/2024" },
        { name: "Backend API", status: "pending", dueDate: "30/03/2024" },
        { name: "Payment Integration", status: "pending", dueDate: "15/04/2024" },
        { name: "Testing & Launch", status: "pending", dueDate: "10/05/2024" }
      ],
      teamMembers: [] // Will be populated from database
    }
  };

  const stages = [
    { id: "new", label: "New Leads", status: "new" as const },
    { id: "contacted", label: "Contacted", status: "contacted" as const },
    { id: "qualified", label: "Qualified", status: "qualified" as const },
    { id: "proposal", label: "Proposal", status: "proposal" as const },
    { id: "negotiation", label: "Negotiation", status: "negotiation" as const },
    { id: "won", label: "Won", status: "won" as const },
    { id: "lost", label: "Lost", status: "lost" as const },
  ];

  const getLeadsByStage = (status: string) => {
    return leads.filter(lead => lead.status === status);
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) {
      return;
    }

    const leadId = active.id as string;
    const newStatus = over.id as string;

    // Check if dropped on a stage column
    const validStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
    if (!validStatuses.includes(newStatus)) {
      // Check if dropped on a lead card (same status, no change needed)
      const lead = leads.find(l => l.id === leadId);
      if (lead && lead.status === newStatus) {
        return;
      }
      return;
    }

    // Check if lead is already in this status
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status === newStatus) {
      return;
    }

    // Update lead status
    await handleUpdateLeadStatus(leadId, newStatus as Lead["status"]);
  };

  // Droppable Stage Column
  const DroppableStage = ({ stage, children }: { stage: typeof stages[0]; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
      id: stage.status,
    });

    return (
      <div ref={setNodeRef} className="h-full">
        {children}
      </div>
    );
  };

  // Sortable Lead Card Component
  const SortableLeadCard = ({ lead, stageId }: { lead: Lead; stageId: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: lead.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-3 border rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-background ${isDragging ? 'ring-2 ring-primary' : ''}`}
        onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">{lead.name}</h4>
              <span className="text-xs font-medium">{formatINRCompact(lead.value)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{lead.company}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-xs text-background font-medium">
              {(lead.assigned_to_name || lead.assignedTo || 'U').charAt(0)}
            </div>
          </div>
          {lead.probability !== undefined && (
            <div className="flex items-center gap-1">
              <div className="w-12 bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${lead.probability}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{lead.probability}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const activeProjects = leads.filter(lead => lead.status === "won");

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case "excellent": return "text-emerald-600";
      case "good": return "text-accent-foreground";
      case "average": return "text-amber-600";
      case "poor": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getTimelineColor = (timeline?: string) => {
    switch (timeline) {
      case "on-track": return "text-emerald-600";
      case "at-risk": return "text-amber-600";
      case "delayed": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  // Create Lead Full-Page Form
  if (currentPage === "create-lead") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentPage("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Add New Lead</h1>
                  <p className="text-sm text-muted-foreground">Create new lead in pipeline</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentPage("main")} className="rounded-xl">Cancel</Button>
                <Button 
                  type="button"
                  className="rounded-xl"
                  disabled={creatingLead || !leadForm.name}
                  onClick={async (e) => {
                    e.preventDefault();
                    console.log('[CRM] Header Save Lead button clicked');
                    await handleCreateLead();
                  }}
                >
                  {creatingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Lead"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <form onSubmit={async (e) => {
              console.log('[CRM] ===== FULL-PAGE FORM SUBMIT EVENT TRIGGERED =====');
              e.preventDefault();
              e.stopPropagation();
              console.log('[CRM] preventDefault and stopPropagation called');
              console.log('[CRM] Form submitted, calling handleCreateLead');
              console.log('[CRM] Current form state:', JSON.stringify(leadForm, null, 2));
              
              // Validate before proceeding
              if (!leadForm.name || leadForm.name.trim() === '') {
                console.error('[CRM] Form validation failed: Name is required');
                toast.error("Name is required");
                return;
              }
              
              try {
                console.log('[CRM] About to call handleCreateLead...');
                await handleCreateLead();
                console.log('[CRM] handleCreateLead completed successfully');
                // Navigate back to main page on success
                setCurrentPage("main");
              } catch (error) {
                console.error('[CRM] ===== ERROR IN FULL-PAGE FORM onSubmit HANDLER =====');
                console.error('[CRM] Error:', error);
                console.error('[CRM] Error type:', error?.constructor?.name);
                console.error('[CRM] Error message:', error instanceof Error ? error.message : String(error));
                console.error('[CRM] Error stack:', error instanceof Error ? error.stack : 'No stack');
                toast.error('An unexpected error occurred. Please try again.');
              }
            }} className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Lead Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <input 
                      type="text" 
                      placeholder="John Smith" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <input 
                      type="text" 
                      placeholder="Tech Corp" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.company || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input 
                      type="email" 
                      placeholder="john@techcorp.com" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.email || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input 
                      type="tel" 
                      placeholder="+91 98765 43210" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.phone || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Deal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deal Value (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="500000" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.value || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, value: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status *</label>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.status}
                      onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value as Lead["status"] })}
                      required
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Type</label>
                    <input 
                      type="text" 
                      placeholder="Website Development" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.stage || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assign To</label>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.assigned_to || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, assigned_to: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {teamsLoading ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        teams.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.full_name || member.email} {member.role ? `(${member.role})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Lead Source & Probability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Source</label>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.source || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}
                    >
                      <option value="">Select source</option>
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="cold_call">Cold Call</option>
                      <option value="email">Email</option>
                      <option value="social_media">Social Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Probability (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      placeholder="0" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.probability || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, probability: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Close Date</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.expected_close_date || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, expected_close_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Industry</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Technology, Healthcare" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.industry || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Size</label>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.company_size || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, company_size: e.target.value })}
                    >
                      <option value="">Select size</option>
                      <option value="startup">Startup</option>
                      <option value="small">Small (1-50)</option>
                      <option value="medium">Medium (51-200)</option>
                      <option value="large">Large (201-1000)</option>
                      <option value="enterprise">Enterprise (1000+)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input 
                      type="text" 
                      placeholder="City, State" 
                      className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                      value={leadForm.location || ""}
                      onChange={(e) => setLeadForm({ ...leadForm, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Additional Information</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea 
                    rows={4} 
                    placeholder="Add any relevant information about this lead..." 
                    className="w-full px-4 py-2 rounded-xl border border-border bg-background"
                    value={leadForm.notes || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentPage("main")} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl" disabled={creatingLead || !leadForm.name}>
                  {creatingLead ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save Lead
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Create Task Full-Page Form
  if (currentPage === "create-task") {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
          <div className="w-full">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentPage("main")} className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium">Create New Task</h1>
                  <p className="text-sm text-muted-foreground">Assign task to team member</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentPage("main")} className="rounded-xl">Cancel</Button>
                <Button className="rounded-xl">Create Task</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <form className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Task Details</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title *</label>
                  <input type="text" placeholder="Complete homepage design" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <textarea rows={4} placeholder="Detailed task description..." className="w-full px-4 py-2 rounded-xl border border-border bg-background"></textarea>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Assignment & Priority</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assign To *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="">Unassigned</option>
                      {teamsLoading ? (
                        <option value="" disabled>Loading...</option>
                      ) : (
                        teams.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.full_name || member.email} {member.role ? `(${member.role})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link to Lead/Project</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="">Select lead</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.company} - {lead.projectType || lead.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date *</label>
                    <input type="date" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentPage("main")} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="CRM"
        description="Manage leads, customers, and sales pipeline"
        searchPlaceholder="Search leads..."
        action={{
          label: view === "customers" ? "Add Customer" : "Add Lead",
          onClick: () => view === "customers" ? setShowCustomerModal(true) : setCurrentPage("create-lead")
        }}
        secondaryAction={{
          label: "Export",
          onClick: handleExportLeads,
          icon: Download
        }}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <MetricCard
              title="Total Leads"
              value={leads.length.toString()}
              icon={Users}
              subtitle={leads.length === 0 ? "No leads yet" : `${leads.filter(l => l.status === 'new').length} new`}
              highlight={true}
            />
            <MetricCard
              title="Active Projects"
              value={leads.filter(l => l.status === 'won').length.toString()}
              icon={CheckCircle2}
              subtitle={leads.filter(l => l.status === 'won').length === 0 ? "No active projects" : `${leads.filter(l => l.status === 'won').length} won`}
            />
            <MetricCard
              title="Pipeline Value"
              value={formatINRCompact(leads.reduce((sum, lead) => sum + (lead.value || 0), 0))}
              icon={Currency}
              subtitle={leads.length === 0 ? "No pipeline value" : `${leads.length} leads in pipeline`}
            />
            <MetricCard
              title="Active Tasks"
              value="0"
              icon={Activity}
              subtitle="No tasks available"
            />
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="list" className="rounded-lg">All Leads</TabsTrigger>
              <TabsTrigger value="kanban" className="rounded-lg">Pipeline View</TabsTrigger>
              <TabsTrigger value="projects" className="rounded-lg">Active Projects</TabsTrigger>
              <TabsTrigger value="customers" className="rounded-lg">Customers</TabsTrigger>
            </TabsList>

            {/* List View */}
            <TabsContent value="list" className="mt-6">
              <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium text-muted-foreground">Lead</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Company</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Contact</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Value</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Source</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Probability</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Assigned</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Last Contact</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-12 text-center text-muted-foreground">
                            <p className="text-sm">No leads found</p>
                            <p className="text-xs mt-2">Leads will appear here once they are added</p>
                          </td>
                        </tr>
                      ) : (
                        leads.map((lead) => (
                        <tr 
                          key={lead.id} 
                          className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background font-medium">
                                {lead.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{lead.name}</p>
                                <p className="text-xs text-muted-foreground">{lead.stage}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{lead.company}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              {/* <span className="text-lg font-semibold">₹</span> */}
                              {formatINR(lead.value)}
                            </div>
                          </td>
                          <td className="p-4">
                            <Select 
                              value={lead.status} 
                              onValueChange={(value) => handleUpdateLeadStatus(lead.id, value as Lead["status"])}
                              disabled={updatingStatus === lead.id}
                            >
                              <SelectTrigger className="w-[140px] h-8 rounded-lg" onClick={(e) => e.stopPropagation()}>
                                <SelectValue>
                                  <StatusBadge status={lead.status as any} />
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="proposal">Proposal</SelectItem>
                                <SelectItem value="negotiation">Negotiation</SelectItem>
                                <SelectItem value="won">Won</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {lead.source || '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${lead.probability || 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{lead.probability || 0}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {lead.assigned_to_name || lead.assignedTo || 'Unassigned'}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{lead.lastContact}</td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setShowDetailModal(true); }}>
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditLead(lead); }}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setShowFollowupModal(true); }}>
                                  <MessageSquare className="w-4 h-4 mr-2" /> Schedule Follow-up
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Kanban View */}
            <TabsContent value="kanban" className="mt-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                  {stages.map((stage) => {
                    const stageLeads = getLeadsByStage(stage.status);
                    const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
                    
                    return (
                      <DroppableStage key={stage.id} stage={stage}>
                        <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col h-full">
                          <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-sm">{stage.label}</h3>
                              <span className="text-xs bg-muted px-2 py-1 rounded-full">{stageLeads.length}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatINR(stageValue)}</p>
                          </div>
                          <SortableContext
                            items={stageLeads.map(l => l.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="p-3 space-y-3 flex-1 overflow-auto max-h-[600px] min-h-[200px]">
                              {stageLeads.map((lead) => (
                                <SortableLeadCard key={lead.id} lead={lead} stageId={stage.id} />
                              ))}
                              {stageLeads.length === 0 && (
                                <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                                  Drop leads here
                                </div>
                              )}
                            </div>
                          </SortableContext>
                        </div>
                      </DroppableStage>
                    );
                  })}
                </div>
                <DragOverlay>
                  {activeId ? (
                    <div className="p-3 border rounded-xl bg-background shadow-lg opacity-90">
                      <p className="font-medium text-sm">
                        {leads.find(l => l.id === activeId)?.name || 'Lead'}
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </TabsContent>

            {/* Projects View */}
            <TabsContent value="projects" className="mt-6">
              <div className="grid gap-5">
                {activeProjects.map((project) => (
                  <div key={project.id} className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background font-medium">
                            {(project.company || project.name).split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{project.company}</h3>
                            <p className="text-sm text-muted-foreground">{project.projectType}</p>
                            <p className="text-xs text-muted-foreground mt-1">Lead: {project.name} • Assigned to: {project.assignedTo}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1 rounded-lg bg-muted text-xs">
                          <span className="text-muted-foreground">Value:</span>
                          <span className="font-medium ml-1">{formatINRCompact(project.value)}</span>
                        </div>
                        <div className="px-3 py-1 rounded-lg bg-muted text-xs">
                          <span className="text-muted-foreground">Deadline:</span>
                          <span className="font-medium ml-1">{project.deadline ? formatDate(project.deadline) : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-muted/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Progress</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Quality</span>
                        </div>
                        <span className={`text-sm font-medium capitalize ${getQualityColor(project.quality)}`}>
                          {project.quality || 'Not assessed'}
                        </span>
                      </div>

                      <div className="bg-muted/30 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Timeline</span>
                        </div>
                        <span className={`text-sm font-medium capitalize ${getTimelineColor(project.timeline)}`}>
                          {project.timeline || 'Not set'}
                        </span>
                      </div>
                    </div>

                    {/* Project Tasks */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Related Tasks</h4>
                      <div className="space-y-2">
                        {tasks.filter(t => t.linkedLead === Number(project.id)).map((task) => (
                          <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            <div className={`w-2 h-2 rounded-full ${
                              task.status === 'completed' ? 'bg-emerald-600' :
                              task.status === 'in-progress' ? 'bg-blue-600' :
                              task.status === 'blocked' ? 'bg-red-600' : 'bg-muted-foreground'
                            }`} />
                            <span className="text-sm flex-1">{task.title}</span>
                            <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                              task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl flex-1"
                        onClick={() => { setSelectedLead(project); setShowDetailModal(true); }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {project.timeline === 'at-risk' || project.timeline === 'delayed' ? (
                        <Button 
                          size="sm" 
                          className="rounded-xl bg-amber-600 hover:bg-amber-700"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Assign More Resources
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Customers View */}
            <TabsContent value="customers" className="mt-6">
              <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 text-sm font-medium text-muted-foreground">Name</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Company</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Contact</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Created</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {customersLoading ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : customers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-muted-foreground">
                            <p className="text-sm">No customers found</p>
                            <p className="text-xs mt-2">Customers will appear here once they are added or converted from leads</p>
                          </td>
                        </tr>
                      ) : (
                        customers.map((customer) => (
                          <tr 
                            key={customer.id} 
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background font-medium">
                                  {customer.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{customer.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{customer.company || '-'}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                {customer.email && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    {customer.email}
                                  </div>
                                )}
                                {customer.phone && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    {customer.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                customer.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                customer.status === 'inactive' ? 'bg-amber-100 text-amber-700' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {customer.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {customer.created_at ? formatDate(customer.created_at) : '-'}
                            </td>
                            <td className="p-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedCustomer(customer); }}>
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Lead Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Create a new lead in the sales pipeline.</DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            console.log('[CRM] ===== FORM SUBMIT EVENT TRIGGERED =====');
            e.preventDefault();
            e.stopPropagation();
            console.log('[CRM] preventDefault and stopPropagation called');
            console.log('[CRM] Form submitted, calling handleCreateLead');
            console.log('[CRM] Current form state:', leadForm);
            try {
              await handleCreateLead();
              console.log('[CRM] handleCreateLead completed');
            } catch (error) {
              console.error('[CRM] ===== ERROR IN FORM onSubmit HANDLER =====');
              console.error('[CRM] Error:', error);
              console.error('[CRM] Error stack:', error instanceof Error ? error.stack : 'No stack');
              toast.error('An unexpected error occurred. Please try again.');
            }
          }}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="John Smith" 
                    className="rounded-xl"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    required
                  />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company" 
                    placeholder="Tech Corp" 
                    className="rounded-xl"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                  />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@techcorp.com" 
                    className="rounded-xl"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 98765 43210" 
                    className="rounded-xl"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Deal Value (₹)</Label>
                  <Input 
                    id="value" 
                    type="number" 
                    placeholder="500000" 
                    className="rounded-xl"
                    value={leadForm.value || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, value: parseFloat(e.target.value) || 0 })}
                  />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                  <Select 
                    value={leadForm.status}
                    onValueChange={(value) => setLeadForm({ ...leadForm, status: value as Lead["status"] })}
                  >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
              <div>
                <Label htmlFor="stage">Stage</Label>
                <Input 
                  id="stage" 
                  placeholder="e.g., Initial Contact, Proposal Sent" 
                  className="rounded-xl"
                  value={leadForm.stage}
                  onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Select 
                  value={leadForm.assigned_to}
                  onValueChange={(value) => setLeadForm({ ...leadForm, assigned_to: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select team member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamsLoading ? (
                      <SelectItem value="" disabled>Loading team members...</SelectItem>
                    ) : teams.length === 0 ? (
                      <SelectItem value="" disabled>No team members available</SelectItem>
                    ) : (
                      teams.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email} {member.role ? `(${member.role})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Select 
                    value={leadForm.source}
                    onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input 
                    id="probability" 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0" 
                    className="rounded-xl"
                    value={leadForm.probability || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, probability: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected_close_date">Expected Close Date</Label>
                  <Input 
                    id="expected_close_date" 
                    type="date" 
                    className="rounded-xl"
                    value={leadForm.expected_close_date || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, expected_close_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input 
                    id="industry" 
                    placeholder="e.g., Technology, Healthcare" 
                    className="rounded-xl"
                    value={leadForm.industry || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, industry: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select 
                    value={leadForm.company_size}
                    onValueChange={(value) => setLeadForm({ ...leadForm, company_size: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="small">Small (1-50)</SelectItem>
                      <SelectItem value="medium">Medium (51-200)</SelectItem>
                      <SelectItem value="large">Large (201-1000)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="City, State" 
                    className="rounded-xl"
                    value={leadForm.location || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, location: e.target.value })}
                  />
                </div>
              </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Add any relevant information..." 
                  className="rounded-xl"
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                />
            </div>
          </div>
          <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setLeadForm({
                    name: "",
                    company: "",
                    email: "",
                    phone: "",
                    value: 0,
                    status: "new",
                    stage: "",
                    notes: "",
                    assigned_to: "",
                    source: "",
                    probability: 0,
                    expected_close_date: "",
                    industry: "",
                    company_size: "",
                    location: "",
                    tags: [],
                  });
                }} 
                className="rounded-xl"
                disabled={creatingLead}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="rounded-xl"
                disabled={creatingLead || !leadForm.name}
                onClick={(e) => {
                  console.log('[CRM] ===== SUBMIT BUTTON CLICKED =====');
                  console.log('[CRM] Button disabled?', creatingLead || !leadForm.name);
                  console.log('[CRM] creatingLead:', creatingLead);
                  console.log('[CRM] leadForm.name:', leadForm.name);
                  console.log('[CRM] Full leadForm:', JSON.stringify(leadForm, null, 2));
                  
                  // If button is disabled, prevent action
                  if (creatingLead || !leadForm.name) {
                    console.warn('[CRM] Button is disabled, preventing default');
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  
                  // Log that button click will trigger form submit
                  console.log('[CRM] Button click will trigger form onSubmit (type="submit")');
                  // Don't prevent default - let the form onSubmit handle it
                }}
              >
                {creatingLead ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Lead"
                )}
              </Button>
          </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lead & Project Details</DialogTitle>
              <DialogDescription>View and manage lead information and project details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Lead Info */}
              <div className="flex items-start gap-4 pb-6 border-b">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background text-xl font-medium">
                  {selectedLead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedLead.name}</h3>
                  <p className="text-muted-foreground">{selectedLead.company}</p>
                  <div className="flex gap-2 mt-2 items-center">
                    <Select 
                      value={selectedLead.status} 
                      onValueChange={(value) => handleUpdateLeadStatus(selectedLead.id, value as Lead["status"])}
                      disabled={updatingStatus === selectedLead.id}
                    >
                      <SelectTrigger className="w-[140px] h-8 rounded-lg">
                        <SelectValue>
                          <StatusBadge status={selectedLead.status as any} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="proposal">Proposal</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    {(selectedLead.assigned_to_name || selectedLead.assignedTo) && (
                      <span className="text-sm text-muted-foreground">
                        • Assigned to {selectedLead.assigned_to_name || selectedLead.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Deal Value</p>
                  <p className="text-2xl font-semibold">{formatINR(selectedLead.value)}</p>
                </div>
              </div>

              {/* Contact & Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium">{selectedLead.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm font-medium">{selectedLead.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Stage</p>
                  <p className="text-sm font-medium">{selectedLead.stage || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Source</p>
                  <p className="text-sm font-medium">{selectedLead.source || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Industry</p>
                  <p className="text-sm font-medium">{selectedLead.industry || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company Size</p>
                  <p className="text-sm font-medium">{selectedLead.company_size || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-medium">{selectedLead.location || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Probability</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${selectedLead.probability || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{selectedLead.probability || 0}%</span>
                  </div>
                </div>
                {selectedLead.expected_close_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Expected Close Date</p>
                    <p className="text-sm font-medium">{formatDate(selectedLead.expected_close_date)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Contact</p>
                  <p className="text-sm font-medium">{selectedLead.lastContact || selectedLead.updated_at || '-'}</p>
                </div>
              </div>

              {/* Project Details (if won) */}
              {selectedLead.status === "won" && projectDetails[selectedLead.id] && (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                    <TabsTrigger value="requirements" className="rounded-lg">Requirements</TabsTrigger>
                    <TabsTrigger value="attachments" className="rounded-lg">Attachments</TabsTrigger>
                    <TabsTrigger value="milestones" className="rounded-lg">Milestones</TabsTrigger>
                    <TabsTrigger value="team" className="rounded-lg">Team</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Project Description</h4>
                        <p className="text-sm text-muted-foreground">{projectDetails[selectedLead.id].description}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/30 rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                          <p className="text-sm font-medium">{projectDetails[selectedLead.id].timeline}</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-1">Budget</p>
                          <p className="text-sm font-medium">{formatINR(projectDetails[selectedLead.id].budget)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-4">
                          <p className="text-xs text-muted-foreground mb-1">Progress</p>
                          <p className="text-sm font-medium">{selectedLead.progress}%</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="requirements" className="mt-4">
                    <div className="space-y-2">
                      {projectDetails[selectedLead.id].requirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <span className="text-sm">{req}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="attachments" className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {projectDetails[selectedLead.id].attachments.map((attachment, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                          {attachment.type === 'file' && <FileText className="w-5 h-5 text-foreground" />}
                          {attachment.type === 'image' && <ImageIcon className="w-5 h-5 text-emerald-600" />}
                          {attachment.type === 'link' && <LinkIcon className="w-5 h-5 text-accent-foreground" />}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{attachment.type}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full rounded-xl">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Attachment
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="milestones" className="mt-4">
                    <div className="space-y-3">
                      {projectDetails[selectedLead.id].milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            milestone.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                            milestone.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                            'bg-muted'
                          }`}>
                            {milestone.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : milestone.status === 'in-progress' ? (
                              <Clock className="w-5 h-5 text-accent-foreground" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">Due: {milestone.dueDate}</p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full capitalize ${
                            milestone.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {milestone.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="team" className="mt-4">
                    <div className="space-y-3">
                      {projectDetails[selectedLead.id].teamMembers.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background font-medium">
                            {member.split(' ')[0].charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{member}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Team Member
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {/* Follow-ups Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Follow-ups</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl"
                    onClick={() => setShowFollowupModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Follow-up
                  </Button>
                </div>
                <div className="space-y-3">
                  {followups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No follow-ups scheduled</p>
                  ) : (
                    followups.map((followup: any) => (
                      <div key={followup.id} className="flex gap-3 p-3 border rounded-xl">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          followup.type === 'call' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          followup.type === 'email' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          followup.type === 'meeting' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          'bg-muted'
                        }`}>
                          {followup.type === 'call' ? (
                            <Phone className="w-5 h-5 text-blue-600" />
                          ) : followup.type === 'email' ? (
                            <Mail className="w-5 h-5 text-purple-600" />
                          ) : followup.type === 'meeting' ? (
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium capitalize">{followup.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {followup.scheduled_at ? formatDate(followup.scheduled_at) : 'Not scheduled'}
                          </p>
                          {followup.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{followup.notes}</p>
                          )}
                        </div>
                        {followup.completed_at ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="font-medium mb-3">Activity Timeline</h4>
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No activities recorded</p>
                  ) : (
                    activities.map((activity: any) => (
                      <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.action === 'CREATE' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                          activity.action === 'UPDATE' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          'bg-muted'
                        }`}>
                          {activity.action === 'CREATE' ? (
                            <Plus className="w-4 h-4 text-emerald-600" />
                          ) : activity.action === 'UPDATE' ? (
                            <Edit className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user_name || 'System'} • {activity.created_at ? formatDate(activity.created_at) : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => {
                    if (selectedLead) {
                      handleEditLead(selectedLead);
                      setShowDetailModal(false);
                    }
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Lead
                </Button>
                {selectedLead?.status === "won" && (
                  <Button 
                    variant="outline" 
                    className="rounded-xl"
                    onClick={() => {
                      if (selectedLead) {
                        handleConvertToCustomer(selectedLead.id);
                      }
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Convert to Customer
                  </Button>
                )}
                <Button 
                  className="rounded-xl"
                  onClick={() => setShowFollowupModal(true)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Follow-up
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Lead Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateLead(); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input 
                    id="edit-name" 
                    placeholder="John Smith" 
                    className="rounded-xl"
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-company">Company</Label>
                  <Input 
                    id="edit-company" 
                    placeholder="Tech Corp" 
                    className="rounded-xl"
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input 
                    id="edit-email" 
                    type="email" 
                    placeholder="john@techcorp.com" 
                    className="rounded-xl"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input 
                    id="edit-phone" 
                    placeholder="+91 98765 43210" 
                    className="rounded-xl"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-value">Deal Value (₹)</Label>
                  <Input 
                    id="edit-value" 
                    type="number" 
                    placeholder="500000" 
                    className="rounded-xl"
                    value={leadForm.value || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={leadForm.status}
                    onValueChange={(value) => setLeadForm({ ...leadForm, status: value as Lead["status"] })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-source">Source</Label>
                  <Select 
                    value={leadForm.source}
                    onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="social_media">Social Media</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-probability">Probability (%)</Label>
                  <Input 
                    id="edit-probability" 
                    type="number" 
                    min="0" 
                    max="100" 
                    placeholder="0" 
                    className="rounded-xl"
                    value={leadForm.probability || ""}
                    onChange={(e) => setLeadForm({ ...leadForm, probability: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea 
                  id="edit-notes" 
                  placeholder="Add any relevant information..." 
                  className="rounded-xl"
                  value={leadForm.notes}
                  onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowEditModal(false)} 
                className="rounded-xl"
                disabled={editingLead}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="rounded-xl"
                disabled={editingLead || !leadForm.name}
              >
                {editingLead ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Lead"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Customer Modal */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new customer record.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateCustomer(); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-name">Full Name *</Label>
                  <Input 
                    id="customer-name" 
                    placeholder="John Smith" 
                    className="rounded-xl"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customer-company">Company</Label>
                  <Input 
                    id="customer-company" 
                    placeholder="Tech Corp" 
                    className="rounded-xl"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-email">Email</Label>
                  <Input 
                    id="customer-email" 
                    type="email" 
                    placeholder="john@techcorp.com" 
                    className="rounded-xl"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input 
                    id="customer-phone" 
                    placeholder="+91 98765 43210" 
                    className="rounded-xl"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer-address">Address</Label>
                <Textarea 
                  id="customer-address" 
                  placeholder="Full address..." 
                  className="rounded-xl"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-gstin">GSTIN</Label>
                  <Input 
                    id="customer-gstin" 
                    placeholder="GSTIN number" 
                    className="rounded-xl"
                    value={customerForm.gstin}
                    onChange={(e) => setCustomerForm({ ...customerForm, gstin: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-pan">PAN</Label>
                  <Input 
                    id="customer-pan" 
                    placeholder="PAN number" 
                    className="rounded-xl"
                    value={customerForm.pan}
                    onChange={(e) => setCustomerForm({ ...customerForm, pan: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowCustomerModal(false)} 
                className="rounded-xl"
                disabled={creatingCustomer}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="rounded-xl"
                disabled={creatingCustomer || !customerForm.name}
              >
                {creatingCustomer ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Customer"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Follow-up Modal */}
      <Dialog open={showFollowupModal} onOpenChange={setShowFollowupModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>Schedule a follow-up for this lead.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateFollowup(); }}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="followup-type">Type</Label>
                <Select 
                  value={followupForm.type}
                  onValueChange={(value) => setFollowupForm({ ...followupForm, type: value as any })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="followup-date">Scheduled Date & Time *</Label>
                <Input 
                  id="followup-date" 
                  type="datetime-local" 
                  className="rounded-xl"
                  value={followupForm.scheduled_at}
                  onChange={(e) => setFollowupForm({ ...followupForm, scheduled_at: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="followup-notes">Notes</Label>
                <Textarea 
                  id="followup-notes" 
                  placeholder="Add notes about this follow-up..." 
                  className="rounded-xl"
                  value={followupForm.notes}
                  onChange={(e) => setFollowupForm({ ...followupForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setShowFollowupModal(false)} 
                className="rounded-xl"
                disabled={creatingFollowup}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="rounded-xl"
                disabled={creatingFollowup || !followupForm.scheduled_at}
              >
                {creatingFollowup ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Follow-up"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Assign a new task to team members.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="task-title">Task Title</Label>
              <Input id="task-title" placeholder="Complete homepage design" className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea id="task-description" placeholder="Detailed task description..." className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-assignee">Assign To</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamsLoading ? (
                      <SelectItem value="" disabled>Loading team members...</SelectItem>
                    ) : teams.length === 0 ? (
                      <SelectItem value="" disabled>No team members available</SelectItem>
                    ) : (
                      teams.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email} {member.role ? `(${member.role})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-lead">Link to Lead/Project</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id.toString()}>
                        {lead.company} - {lead.projectType || lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-due">Due Date</Label>
                <Input id="task-due" type="date" className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskModal(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={() => setShowTaskModal(false)} className="rounded-xl">Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}