import { useState } from "react";
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
  DollarSign,
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
  Download
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { formatINR, formatINRCompact, formatIndianDate } from "../utils/formatters";

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  stage: string;
  lastContact: string;
  assignedTo: string;
  projectType?: string;
  deadline?: string;
  progress?: number;
  quality?: "excellent" | "good" | "average" | "poor";
  timeline?: "on-track" | "at-risk" | "delayed";
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
  const [view, setView] = useState<"list" | "kanban" | "projects">("list");
  const [currentPage, setCurrentPage] = useState<"main" | "detail" | "create-lead" | "create-task">("main");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const leads: Lead[] = [
    { 
      id: 1, 
      name: "John Smith", 
      company: "Tech Corp", 
      email: "john@techcorp.com", 
      phone: "+91 98765 43210", 
      value: 500000, 
      status: "won", 
      stage: "Project Started", 
      lastContact: "2 hours ago", 
      assignedTo: "Sarah",
      projectType: "Website Development",
      deadline: "2024-03-15",
      progress: 65,
      quality: "excellent",
      timeline: "on-track"
    },
    { 
      id: 2, 
      name: "Emma Wilson", 
      company: "Design Co", 
      email: "emma@designco.com", 
      phone: "+91 98765 43211", 
      value: 350000, 
      status: "won", 
      stage: "In Development", 
      lastContact: "1 day ago", 
      assignedTo: "Mike",
      projectType: "Mobile App",
      deadline: "2024-04-20",
      progress: 40,
      quality: "good",
      timeline: "on-track"
    },
    { 
      id: 3, 
      name: "Michael Brown", 
      company: "Startup Inc", 
      email: "mike@startup.com", 
      phone: "+91 98765 43212", 
      value: 750000, 
      status: "won", 
      stage: "Design Phase", 
      lastContact: "3 hours ago", 
      assignedTo: "Sarah",
      projectType: "E-commerce Platform",
      deadline: "2024-05-10",
      progress: 25,
      quality: "good",
      timeline: "at-risk"
    },
    { 
      id: 4, 
      name: "Lisa Anderson", 
      company: "Enterprise Ltd", 
      email: "lisa@enterprise.com", 
      phone: "+91 98765 43213", 
      value: 1200000, 
      status: "negotiation", 
      stage: "Contract Review", 
      lastContact: "Just now", 
      assignedTo: "John" 
    },
    { 
      id: 5, 
      name: "Robert Chen", 
      company: "Media House", 
      email: "robert@mediahouse.com", 
      phone: "+91 98765 43214", 
      value: 450000, 
      status: "proposal", 
      stage: "Proposal Sent", 
      lastContact: "5 hours ago", 
      assignedTo: "Mike" 
    },
  ];

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Complete homepage design",
      description: "Design the homepage according to client specifications",
      assignedTo: "Sarah",
      linkedLead: 1,
      linkedLeadName: "Tech Corp - Website Development",
      status: "in-progress",
      priority: "high",
      dueDate: "2024-02-15",
      progress: 70
    },
    {
      id: 2,
      title: "API integration",
      description: "Integrate third-party payment gateway",
      assignedTo: "Mike",
      linkedLead: 2,
      linkedLeadName: "Design Co - Mobile App",
      status: "in-progress",
      priority: "urgent",
      dueDate: "2024-02-10",
      progress: 45
    },
    {
      id: 3,
      title: "Database schema design",
      description: "Design and implement database structure",
      assignedTo: "John",
      linkedLead: 3,
      linkedLeadName: "Startup Inc - E-commerce Platform",
      status: "completed",
      priority: "medium",
      dueDate: "2024-02-08",
      progress: 100
    },
  ]);

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
      teamMembers: ["Sarah (Lead Designer)", "Mike (Developer)", "Emma (QA)"]
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
      teamMembers: ["Mike (Lead Developer)", "John (Backend)", "Lisa (iOS)", "Sarah (Android)"]
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
      teamMembers: ["Sarah (Project Lead)", "Mike (Frontend)", "John (Backend)", "Emma (DevOps)"]
    }
  };

  const stages = [
    { id: "new", label: "New Leads", status: "new" as const },
    { id: "contacted", label: "Contacted", status: "contacted" as const },
    { id: "qualified", label: "Qualified", status: "qualified" as const },
    { id: "proposal", label: "Proposal", status: "proposal" as const },
    { id: "negotiation", label: "Negotiation", status: "negotiation" as const },
  ];

  const getLeadsByStage = (status: string) => {
    return leads.filter(lead => lead.status === status);
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
                <Button className="rounded-xl">Save Lead</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="w-full max-w-4xl mx-auto">
            <form className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Lead Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name *</label>
                    <input type="text" placeholder="John Smith" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company *</label>
                    <input type="text" placeholder="Tech Corp" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <input type="email" placeholder="john@techcorp.com" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone *</label>
                    <input type="tel" placeholder="+91 98765 43210" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Deal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deal Value (₹) *</label>
                    <input type="number" placeholder="500000" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Type</label>
                    <input type="text" placeholder="Website Development" className="w-full px-4 py-2 rounded-xl border border-border bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assign To *</label>
                    <select className="w-full px-4 py-2 rounded-xl border border-border bg-background">
                      <option value="sarah">Sarah</option>
                      <option value="mike">Mike</option>
                      <option value="john">John</option>
                      <option value="emma">Emma</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h3 className="font-medium text-lg pb-3 border-b">Additional Information</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea rows={4} placeholder="Add any relevant information about this lead..." className="w-full px-4 py-2 rounded-xl border border-border bg-background"></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentPage("main")} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Lead
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
                      <option value="">Select team member</option>
                      <option value="sarah">Sarah</option>
                      <option value="mike">Mike</option>
                      <option value="john">John</option>
                      <option value="emma">Emma</option>
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
          label: "Add Lead",
          onClick: () => setCurrentPage("create-lead")
        }}
        secondaryAction={{
          label: "Import Leads",
          onClick: () => {},
          icon: Download
        }}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 dark:bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                  <p className="text-xl font-semibold">{leads.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Active Projects</p>
                  <p className="text-xl font-semibold">{activeProjects.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 dark:bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Pipeline Value</p>
                  <p className="text-lg font-semibold">{formatINRCompact(leads.reduce((sum, l) => sum + l.value, 0))}</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 dark:bg-accent/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Active Tasks</p>
                  <p className="text-xl font-semibold">{tasks.filter(t => t.status !== "completed").length}</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="list" className="rounded-lg">All Leads</TabsTrigger>
              <TabsTrigger value="kanban" className="rounded-lg">Pipeline View</TabsTrigger>
              <TabsTrigger value="projects" className="rounded-lg">Active Projects</TabsTrigger>
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
                        <th className="p-4 text-sm font-medium text-muted-foreground">Assigned</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground">Last Contact</th>
                        <th className="p-4 text-sm font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
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
                              <DollarSign className="w-4 h-4" />
                              {formatINR(lead.value)}
                            </div>
                          </td>
                          <td className="p-4">
                            <StatusBadge status={lead.status as any} />
                          </td>
                          <td className="p-4 text-sm">{lead.assignedTo}</td>
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
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <Edit className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                  <MessageSquare className="w-4 h-4 mr-2" /> Add Note
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Kanban View */}
            <TabsContent value="kanban" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {stages.map((stage) => {
                  const stageLeads = getLeadsByStage(stage.status);
                  const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
                  
                  return (
                    <div key={stage.id} className="bg-card border border-border rounded-2xl shadow-sm flex flex-col">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">{stage.label}</h3>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">{stageLeads.length}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatINR(stageValue)}</p>
                      </div>
                      <div className="p-3 space-y-3 flex-1 overflow-auto max-h-[600px]">
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="p-3 border rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-background"
                            onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm">{lead.name}</h4>
                              <span className="text-xs font-medium">{formatINRCompact(lead.value)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{lead.company}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-xs text-background font-medium">
                                  {lead.assignedTo.charAt(0)}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{lead.lastContact}</span>
                            </div>
                          </div>
                        ))}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-8 text-sm text-muted-foreground">
                            No leads in this stage
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                            {project.company.split(' ').map(n => n[0]).join('')}
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
                          <span className="font-medium ml-1">{project.deadline ? formatIndianDate(project.deadline) : 'N/A'}</span>
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
                        {tasks.filter(t => t.linkedLead === project.id).map((task) => (
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Smith" className="rounded-xl" />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Tech Corp" className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@techcorp.com" className="rounded-xl" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+91 98765 43210" className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Deal Value (₹)</Label>
                <Input id="value" type="number" placeholder="500000" className="rounded-xl" />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Add any relevant information..." className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={() => setShowCreateModal(false)} className="rounded-xl">Add Lead</Button>
          </DialogFooter>
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
                  <div className="flex gap-2 mt-2">
                    <StatusBadge status={selectedLead.status as any} />
                    <span className="text-sm text-muted-foreground">• Assigned to {selectedLead.assignedTo}</span>
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
                  <p className="text-sm font-medium">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm font-medium">{selectedLead.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Stage</p>
                  <p className="text-sm font-medium">{selectedLead.stage}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Contact</p>
                  <p className="text-sm font-medium">{selectedLead.lastContact}</p>
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

              {/* Activity Timeline */}
              <div>
                <h4 className="font-medium mb-3">Activity Timeline</h4>
                <div className="space-y-3">
                  <div className="flex gap-3 pb-3 border-b">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Meeting scheduled</p>
                      <p className="text-xs text-muted-foreground">Tomorrow at 2:00 PM</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pb-3 border-b">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email sent</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone call completed</p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl">Add Note</Button>
              <Button className="rounded-xl">Schedule Follow-up</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                    <SelectItem value="sarah">Sarah</SelectItem>
                    <SelectItem value="mike">Mike</SelectItem>
                    <SelectItem value="john">John</SelectItem>
                    <SelectItem value="emma">Emma</SelectItem>
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