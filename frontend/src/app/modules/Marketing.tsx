import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Eye,
  Facebook,
  HelpCircle,
  Instagram,
  LayoutTemplate,
  List,
  Mail,
  MessageCircle,
  Plus,
  Rocket,
  Settings,
  Users,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { EmptyState } from "../components/EmptyState";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { marketingApi } from "../../lib/api";
import { toast } from "sonner";

type Channel = "email" | "whatsapp" | "facebook" | "instagram";
type EmailTab = "dashboard" | "campaigns" | "contacts" | "lists" | "templates" | "analytics" | "settings";
type CampaignFilter = "all" | "draft" | "sent";

const logoGreen = "#1EC57A";

const emailTabs: Array<{ id: EmailTab; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "campaigns", label: "Campaigns" },
  { id: "contacts", label: "Contacts" },
  { id: "lists", label: "Lists" },
  { id: "templates", label: "Templates" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
];

function ProgressRing({ value }: { value: number }) {
  return (
    <div
      className="h-4 w-4 rounded-full border border-border"
      style={{
        background: `conic-gradient(${logoGreen} ${value * 3.6}deg, #e5e7eb 0deg)`,
      }}
    />
  );
}

export function Marketing() {
  const [activeChannel] = useState<Channel>("email");
  const [activeEmailTab, setActiveEmailTab] = useState<EmailTab>("dashboard");
  const [dashboardData, setDashboardData] = useState({
    provider: "Mailjet",
    connected: false,
    kpis: [] as Array<{ label: string; value: string; delta: string; positive: boolean }>,
    engagement: [] as Array<{ month: string; opens: number; clicks: number; conversions: number }>,
    distribution: {
      totalLeads: 0,
      deltaText: "",
      segments: [] as Array<{ name: string; value: number; color: string }>,
    },
    campaigns: [] as any[],
    defaults: {
      senderName: "",
      senderEmail: "",
    },
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    subject: "",
    senderName: "",
    senderEmail: "",
    contactsListId: "",
    htmlPart: "",
    textPart: "",
  });
  const [campaignAssets, setCampaignAssets] = useState<Array<{ name: string; url: string; type: string }>>([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>("all");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    email: "",
    name: "",
    listId: "",
  });

  const emptyStateConfig = useMemo(
    () => ({
      campaigns: {
        icon: Mail,
        title: "No campaigns yet",
        description: "Create your first campaign to start reaching your audience.",
        cta: "Create Campaign",
      },
      contacts: {
        icon: Users,
        title: "No contacts yet",
        description: "Import or create contacts to start building your audience.",
        cta: "Add Contacts",
      },
      lists: {
        icon: List,
        title: "No lists yet",
        description: "Group your contacts into smart lists for better targeting.",
        cta: "Create List",
      },
      templates: {
        icon: LayoutTemplate,
        title: "No templates yet",
        description: "Design reusable templates for consistent email campaigns.",
        cta: "Create Template",
      },
      analytics: {
        icon: BarChart3,
        title: "No analytics yet",
        description: "Campaign analytics will appear here once emails are sent.",
        cta: "Go to Campaigns",
      },
      settings: {
        icon: Settings,
        title: "No settings configured",
        description: "Configure sender identity and tracking settings for your emails.",
        cta: "Open Settings",
      },
    }),
    []
  );

  useEffect(() => {
    const loadEmailDashboard = async () => {
      setLoadingDashboard(true);
      const response = await marketingApi.getEmailDashboard();
      if (response.success && response.data) {
        setDashboardData((prev) => ({
          ...prev,
          ...response.data,
          kpis: response.data.kpis?.length ? response.data.kpis : prev.kpis,
          engagement: response.data.engagement?.length ? response.data.engagement : prev.engagement,
          campaigns: Array.isArray(response.data.campaigns) ? response.data.campaigns : [],
          distribution: response.data.distribution || prev.distribution,
          defaults: response.data.defaults || prev.defaults,
        }));
        setCampaignForm((prev) => ({
          ...prev,
          senderName: prev.senderName || response.data.defaults?.senderName || "",
          senderEmail: prev.senderEmail || response.data.defaults?.senderEmail || "",
        }));
      } else if (response.error) {
        toast.error(response.error);
      }
      setLoadingDashboard(false);
    };
    void loadEmailDashboard();
  }, []);

  useEffect(() => {
    const loadMarketingData = async () => {
      const [campaignResponse, contactResponse, listsResponse] = await Promise.all([
        marketingApi.getCampaigns({ limit: 50 }),
        marketingApi.getContacts({ limit: 50 }),
        marketingApi.getContactLists({ limit: 100 }),
      ]);
      if (campaignResponse.success) setCampaigns(campaignResponse.data || []);
      else if (campaignResponse.error) toast.error(campaignResponse.error);
      if (contactResponse.success) setContacts(contactResponse.data || []);
      else if (contactResponse.error) toast.error(contactResponse.error);
      if (listsResponse.success) setContactLists(listsResponse.data || []);
      else if (listsResponse.error) toast.error(listsResponse.error);
    };
    void loadMarketingData();
  }, []);

  useEffect(() => {
    if (!contactLists.length) return;
    setCampaignForm((prev) => {
      if (prev.contactsListId) return prev;
      return { ...prev, contactsListId: String(contactLists[0].ID) };
    });
    setContactForm((prev) => {
      if (prev.listId) return prev;
      return { ...prev, listId: String(contactLists[0].ID) };
    });
  }, [contactLists]);

  const refreshCampaigns = async () => {
    const response = await marketingApi.getCampaigns({ limit: 50 });
    if (response.success) {
      setCampaigns(response.data || []);
      setLastSyncedAt(new Date().toLocaleTimeString("en-IN"));
      return;
    }
    if (response.error) toast.error(response.error);
  };

  const refreshContacts = async () => {
    const [contactsRes, listsRes] = await Promise.all([
      marketingApi.getContacts({ limit: 50 }),
      marketingApi.getContactLists({ limit: 100 }),
    ]);
    if (contactsRes.success) setContacts(contactsRes.data || []);
    if (listsRes.success) setContactLists(listsRes.data || []);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshCampaigns();
      void (async () => {
        const dash = await marketingApi.getEmailDashboard();
        if (dash.success && dash.data) {
          setDashboardData((prev) => ({
            ...prev,
            ...dash.data,
            campaigns: Array.isArray(dash.data.campaigns) ? dash.data.campaigns : prev.campaigns,
          }));
        }
      })();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateCampaign = async () => {
    if (!campaignForm.title.trim() || !campaignForm.subject.trim()) {
      toast.error("Title and subject are required");
      return;
    }
    setCreatingCampaign(true);
    const response = await marketingApi.createCampaign({
      ...campaignForm,
      contactsListId: campaignForm.contactsListId ? Number(campaignForm.contactsListId) : undefined,
      htmlPart:
        campaignAssets.length > 0
          ? `${campaignForm.htmlPart || ""}\n${campaignAssets
              .map((asset) =>
                asset.type.startsWith("image/")
                  ? `<p><img src="${asset.url}" alt="${asset.name}" style="max-width:100%;" /></p>`
                  : `<p><a href="${asset.url}" target="_blank" rel="noopener noreferrer">${asset.name}</a></p>`
              )
              .join("\n")}`
          : campaignForm.htmlPart,
    });
    setCreatingCampaign(false);
    if (!response.success) {
      toast.error(response.error || "Failed to create campaign");
      return;
    }
    toast.success("Campaign draft created");
    setCampaignForm({
      title: "",
      subject: "",
      senderName: "",
      senderEmail: "",
      contactsListId: "",
      htmlPart: "",
      textPart: "",
    });
    setCampaignAssets([]);
    await refreshCampaigns();
  };

  const handleUploadCampaignAsset = async (file: File) => {
    setUploadingAsset(true);
    const response = await marketingApi.uploadCampaignAsset(file);
    setUploadingAsset(false);
    if (!response.success || !response.data) {
      toast.error(response.error || "Failed to upload asset");
      return;
    }
    setCampaignAssets((prev) => [
      ...prev,
      {
        name: response.data.name || file.name,
        url: response.data.url,
        type: response.data.type || file.type,
      },
    ]);
    toast.success("Asset uploaded");
  };

  const handleSendCampaign = async (campaignId: string) => {
    setSendingCampaignId(campaignId);
    const response = await marketingApi.sendCampaign(campaignId);
    setSendingCampaignId(null);
    if (!response.success) {
      toast.error(response.error || "Failed to send campaign");
      return;
    }
    toast.success("Campaign send triggered");
    await refreshCampaigns();
    const dash = await marketingApi.getEmailDashboard();
    if (dash.success && dash.data) {
      setDashboardData((prev) => ({
        ...prev,
        ...dash.data,
        campaigns: Array.isArray(dash.data.campaigns) ? dash.data.campaigns : prev.campaigns,
      }));
    }
  };

  const filteredDashboardCampaigns = useMemo(() => {
    const rows = dashboardData.campaigns || [];
    if (campaignFilter === "all") return rows;
    if (campaignFilter === "draft") return rows.filter((c) => String(c.status || "").toLowerCase() === "draft");
    return rows.filter((c) => String(c.status || "").toLowerCase() !== "draft");
  }, [dashboardData.campaigns, campaignFilter]);

  const filteredCampaigns = useMemo(() => {
    if (campaignFilter === "all") return campaigns;
    if (campaignFilter === "draft") return campaigns.filter((c) => String(c.status || "").toLowerCase() === "draft");
    return campaigns.filter((c) => String(c.status || "").toLowerCase() !== "draft");
  }, [campaigns, campaignFilter]);

  const handleCreateContact = async () => {
    if (!contactForm.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setCreatingContact(true);
    const response = await marketingApi.createContact({
      email: contactForm.email.trim(),
      name: contactForm.name.trim(),
      listId: contactForm.listId ? Number(contactForm.listId) : undefined,
    });
    setCreatingContact(false);
    if (!response.success) {
      toast.error(response.error || "Failed to add contact");
      return;
    }
    toast.success("Contact added");
    setContactForm({ email: "", name: "", listId: "" });
    await refreshContacts();
  };

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) {
      toast.error("List name is required");
      return;
    }
    setCreatingList(true);
    const response = await marketingApi.createContactList(name);
    setCreatingList(false);
    if (!response.success) {
      toast.error(response.error || "Failed to create contact list");
      return;
    }
    toast.success("Contact list created");
    setNewListName("");
    await refreshContacts();
  };

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full rounded-2xl border border-border bg-card p-4 lg:p-6">
          <div className="flex gap-5">
            <aside className="w-16 shrink-0 rounded-2xl border border-border bg-background p-2 flex flex-col justify-between min-h-[760px]">
              <div>
                <div className="mx-auto mb-5 flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: logoGreen }}>
                  <Rocket className="h-4 w-4 text-white" />
                </div>

                <div className="space-y-4">
                  <button className="w-full rounded-xl border px-1 py-2 border-transparent bg-muted/70 shadow-sm">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border" style={{ borderColor: logoGreen }}>
                      <Mail className="h-5 w-5" style={{ color: logoGreen }} />
                    </div>
                    <p className="mt-1 text-center text-[10px] font-medium" style={{ color: logoGreen }}>
                      Email
                    </p>
                  </button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-full rounded-xl px-1 py-2 hover:bg-muted/60 cursor-default">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-border">
                          <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="mt-1 text-center text-[10px] text-muted-foreground">WhatsApp</p>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>Coming soon</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-full rounded-xl px-1 py-2 hover:bg-muted/60 cursor-default">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-border">
                          <Facebook className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="mt-1 text-center text-[10px] text-muted-foreground">Facebook</p>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>Coming soon</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="w-full rounded-xl px-1 py-2 hover:bg-muted/60 cursor-default">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-border">
                          <Instagram className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="mt-1 text-center text-[10px] text-muted-foreground">Instagram</p>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>Coming soon</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full rounded-lg p-2 hover:bg-muted/60">
                  <HelpCircle className="mx-auto h-4 w-4 text-muted-foreground" />
                </button>
                <button className="w-full rounded-lg p-2 hover:bg-muted/60">
                  <Settings className="mx-auto h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </aside>

            <main className="flex-1 min-w-0">
              {activeChannel === "email" ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-medium">Email Marketing</h1>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: logoGreen }} />
                        <span>{dashboardData.provider} · {dashboardData.connected ? "Connected" : "Not connected"}</span>
                      </div>
                    </div>
                    <Button className="rounded-xl text-white" style={{ backgroundColor: logoGreen }}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Campaign
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex gap-1.5 min-w-max">
                      {emailTabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveEmailTab(tab.id)}
                          className={`rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
                            activeEmailTab === tab.id
                              ? "text-white border-transparent"
                              : "text-muted-foreground border-border hover:bg-muted/60"
                          }`}
                          style={activeEmailTab === tab.id ? { backgroundColor: logoGreen } : undefined}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeEmailTab === "dashboard" ? (
                    <div className="space-y-5">
                      {loadingDashboard ? <p className="text-sm text-muted-foreground">Loading live Mailjet data...</p> : null}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {dashboardData.kpis.length === 0 && !loadingDashboard ? (
                          <Card className="p-6 md:col-span-2 xl:col-span-4 text-center">
                            <p className="text-sm text-muted-foreground">No KPI data available yet.</p>
                          </Card>
                        ) : null}
                        {dashboardData.kpis.map((card) => (
                          <Card key={card.label} className="p-4 gap-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-muted-foreground">{card.label}</p>
                                <p className="mt-1 text-3xl font-medium">{card.value}</p>
                              </div>
                              <div className="flex h-12 items-end gap-1">
                                {[12, 22, 16, 26].map((h, idx) => (
                                  <div key={idx} className="w-2 rounded-sm bg-muted" style={{ height: h }} />
                                ))}
                              </div>
                            </div>
                            <p className={`text-xs ${card.positive ? "text-emerald-600" : "text-muted-foreground"}`}>{card.delta}</p>
                            <Button variant="outline" size="sm" className="rounded-lg w-full">View</Button>
                          </Card>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-10 gap-4">
                        <Card className="p-4 xl:col-span-7 gap-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-medium">Email Engagement Over Time</h3>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-border px-3 py-1 text-xs">Jan 2024 - Oct 2024</span>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="rounded-full px-2 py-1 text-white" style={{ backgroundColor: logoGreen }}>Opens</span>
                                <span className="rounded-full border border-border px-2 py-1">Clicks</span>
                                <span className="rounded-full border border-border px-2 py-1">Conversions</span>
                              </div>
                            </div>
                          </div>
                          <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dashboardData.engagement}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                                <YAxis domain={[0, 90]} tickLine={false} axisLine={false} fontSize={12} />
                                <RechartsTooltip />
                                <Bar dataKey="opens" fill={logoGreen} radius={[6, 6, 0, 0]} />
                                <Area type="monotone" dataKey="clicks" fill={`${logoGreen}33`} stroke={logoGreen} strokeWidth={2} />
                                <Line type="monotone" dataKey="conversions" stroke="#6b7280" strokeWidth={2} dot={false} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>

                        <Card className="p-4 xl:col-span-3 gap-2">
                          <h3 className="font-medium">Lead Status Distribution</h3>
                          <div>
                            <p className="text-4xl font-medium leading-none">{dashboardData.distribution.totalLeads}</p>
                            <p className="text-xs text-muted-foreground mt-1">{dashboardData.distribution.deltaText}</p>
                          </div>
                          <div className="h-[170px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={dashboardData.distribution.segments} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={4}>
                                  {dashboardData.distribution.segments.map((entry) => (
                                    <Cell key={entry.name} fill={entry.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex items-center justify-center gap-4 text-xs">
                            {dashboardData.distribution.segments.map((item) => (
                              <div key={item.name} className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span>{item.name}: {item.value}%</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>

                      <Card className="p-4 gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-medium text-lg">Campaigns</h3>
                          <div className="flex items-center gap-3">
                            {lastSyncedAt ? <span className="text-xs text-muted-foreground">Last synced: {lastSyncedAt}</span> : null}
                            <Input className="w-full sm:w-[250px] rounded-lg" placeholder="Search contacts..." />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(["all", "draft", "sent"] as CampaignFilter[]).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setCampaignFilter(filter)}
                              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                                campaignFilter === filter ? "text-white border-transparent" : "text-muted-foreground border-border"
                              }`}
                              style={campaignFilter === filter ? { backgroundColor: logoGreen } : undefined}
                            >
                              {filter}
                            </button>
                          ))}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>Campaign Name</TableHead>
                              <TableHead>Progress</TableHead>
                              <TableHead>Leads</TableHead>
                              <TableHead>Delivered</TableHead>
                              <TableHead>Opened</TableHead>
                              <TableHead>Create Time</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Operation</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDashboardCampaigns.map((row) => (
                              <TableRow key={row.name}>
                                <TableCell><Switch checked={row.active} /></TableCell>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <ProgressRing value={row.progress} />
                                    <span>{row.progress}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>{row.leads}</TableCell>
                                <TableCell>{row.delivered}</TableCell>
                                <TableCell>{row.opened}</TableCell>
                                <TableCell>{row.createdAt}</TableCell>
                                <TableCell className="capitalize">{row.status || "-"}</TableCell>
                                <TableCell>
                                  {String(row.status || "").toLowerCase() === "draft" ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg h-8"
                                      onClick={() => void handleSendCampaign(String(row.id))}
                                      disabled={sendingCampaignId === String(row.id)}
                                    >
                                      {sendingCampaignId === String(row.id) ? "Sending..." : "Send"}
                                    </Button>
                                  ) : (
                                    <Button variant="outline" size="sm" className="rounded-lg h-8">
                                      Report
                                      <Eye className="h-3.5 w-3.5 ml-1" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    </div>
                  ) : activeEmailTab === "campaigns" ? (
                    <Card className="p-4 gap-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Input
                          placeholder="Campaign title"
                          value={campaignForm.title}
                          onChange={(e) => setCampaignForm((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <Input
                          placeholder="Campaign subject"
                          value={campaignForm.subject}
                          onChange={(e) => setCampaignForm((prev) => ({ ...prev, subject: e.target.value }))}
                        />
                        <Input
                          placeholder="Sender name"
                          value={campaignForm.senderName}
                          onChange={(e) => setCampaignForm((prev) => ({ ...prev, senderName: e.target.value }))}
                        />
                        <Input
                          placeholder="Sender email"
                          value={campaignForm.senderEmail}
                          onChange={(e) => setCampaignForm((prev) => ({ ...prev, senderEmail: e.target.value }))}
                        />
                        <select
                          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                          value={campaignForm.contactsListId}
                          onChange={(e) => setCampaignForm((prev) => ({ ...prev, contactsListId: e.target.value }))}
                        >
                          <option value="">Auto-select contact list</option>
                          {contactLists.map((list) => (
                            <option key={list.ID} value={String(list.ID)}>
                              {list.Name || `List ${list.ID}`}
                            </option>
                          ))}
                        </select>
                        <Button onClick={() => void handleCreateCampaign()} disabled={creatingCampaign}>
                          {creatingCampaign ? "Creating..." : "Create Campaign Draft"}
                        </Button>
                        <textarea
                          className="min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm lg:col-span-2"
                          placeholder="HTML content (optional)"
                          value={campaignForm.htmlPart}
                          onChange={(e) => setCampaignForm((prev) => ({ ...prev, htmlPart: e.target.value }))}
                        />
                        <div className="lg:col-span-2 rounded-md border border-border p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">Attachments (image/video)</p>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*,video/*"
                                className="text-sm"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  void handleUploadCampaignAsset(file);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>
                          </div>
                          {uploadingAsset ? <p className="mt-2 text-xs text-muted-foreground">Uploading...</p> : null}
                          {campaignAssets.length ? (
                            <div className="mt-3 space-y-2">
                              {campaignAssets.map((asset) => (
                                <div key={asset.url} className="flex items-center justify-between rounded-md border border-border px-2 py-1 text-xs">
                                  <span className="truncate">{asset.name}</span>
                                  <a href={asset.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                                    Open
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <textarea
                          className="min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm lg:col-span-2"
                          placeholder="Text content (optional)"
                          value={campaignForm.textPart}
                          onChange={(e) => setCampaignForm((prev) => ({ ...prev, textPart: e.target.value }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">Mailjet Campaigns</h3>
                        <div className="flex items-center gap-2">
                          {(["all", "draft", "sent"] as CampaignFilter[]).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setCampaignFilter(filter)}
                              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                                campaignFilter === filter ? "text-white border-transparent" : "text-muted-foreground border-border"
                              }`}
                              style={campaignFilter === filter ? { backgroundColor: logoGreen } : undefined}
                            >
                              {filter}
                            </button>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => void refreshCampaigns()}>
                            Refresh
                          </Button>
                        </div>
                      </div>

                      {filteredCampaigns.length === 0 ? (
                        <EmptyState
                          icon={Mail}
                          title={campaigns.length === 0 ? "No campaigns yet" : "No campaigns for selected filter"}
                          description={
                            campaigns.length === 0
                              ? "No campaigns found in Mailjet. Create your first campaign draft above."
                              : "Try another filter to view campaigns."
                          }
                          action={{ label: "Refresh", onClick: () => void refreshCampaigns() }}
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Title</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCampaigns.map((c) => (
                              <TableRow key={String(c.id)}>
                                <TableCell>{c.id}</TableCell>
                                <TableCell>{c.name || "Untitled"}</TableCell>
                                <TableCell>{c.subject || "-"}</TableCell>
                                <TableCell className="capitalize">{c.status || "-"}</TableCell>
                                <TableCell>{c.createdAt || "-"}</TableCell>
                                <TableCell>
                                  {c.source === "draft" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => void handleSendCampaign(String(c.id))}
                                      disabled={sendingCampaignId === String(c.id)}
                                    >
                                      {sendingCampaignId === String(c.id) ? "Sending..." : "Send"}
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Sent</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Card>
                  ) : activeEmailTab === "contacts" ? (
                    <Card className="p-4 gap-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <Input
                          placeholder="Contact email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                        />
                        <Input
                          placeholder="Contact name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <select
                          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                          value={contactForm.listId}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, listId: e.target.value }))}
                        >
                          <option value="">No list (optional)</option>
                          {contactLists.map((list) => (
                            <option key={list.ID} value={String(list.ID)}>
                              {list.Name || `List ${list.ID}`}
                            </option>
                          ))}
                        </select>
                        <Button onClick={() => void handleCreateContact()} disabled={creatingContact}>
                          {creatingContact ? "Adding..." : "Add Contact"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">Mailjet Contacts</h3>
                        <Button variant="outline" size="sm" onClick={() => void refreshContacts()}>
                          Refresh
                        </Button>
                      </div>

                      {contacts.length === 0 ? (
                        <EmptyState
                          icon={Users}
                          title="No contacts yet"
                          description="No contacts found in Mailjet. Add your first contact above."
                          action={{ label: "Refresh", onClick: () => void refreshContacts() }}
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Last Activity</TableHead>
                              <TableHead>Excluded</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contacts.map((c) => (
                              <TableRow key={String(c.ID)}>
                                <TableCell>{c.ID}</TableCell>
                                <TableCell>{c.Email || "-"}</TableCell>
                                <TableCell>{c.Name || "-"}</TableCell>
                                <TableCell>{c.LastActivityAt ? new Date(c.LastActivityAt).toLocaleString("en-IN") : "-"}</TableCell>
                                <TableCell>{String(c.IsExcludedFromCampaigns ?? false)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Card>
                  ) : activeEmailTab === "lists" ? (
                    <Card className="p-4 gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Input
                          className="w-full sm:w-[320px]"
                          placeholder="New contact list name"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                        />
                        <Button onClick={() => void handleCreateList()} disabled={creatingList}>
                          {creatingList ? "Creating..." : "Create List"}
                        </Button>
                        <Button variant="outline" onClick={() => void refreshContacts()}>
                          Refresh
                        </Button>
                      </div>

                      {contactLists.length === 0 ? (
                        <EmptyState
                          icon={List}
                          title="No lists yet"
                          description="Create your first list and then assign contacts to it."
                          action={{ label: "Create List", onClick: () => void handleCreateList() }}
                        />
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Subscribers</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contactLists.map((list) => (
                              <TableRow key={String(list.ID)}>
                                <TableCell>{list.ID}</TableCell>
                                <TableCell className="font-medium">{list.Name || `List ${list.ID}`}</TableCell>
                                <TableCell>{list.SubscriberCount ?? list.ContactCount ?? "-"}</TableCell>
                                <TableCell>
                                  {list.CreatedAt ? new Date(list.CreatedAt).toLocaleString("en-IN") : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Card>
                  ) : (
                    <Card>
                      <EmptyState
                        icon={emptyStateConfig[activeEmailTab].icon}
                        title={emptyStateConfig[activeEmailTab].title}
                        description={emptyStateConfig[activeEmailTab].description}
                        action={{
                          label: emptyStateConfig[activeEmailTab].cta,
                          onClick: () => {},
                        }}
                      />
                    </Card>
                  )}
                </div>
              ) : null}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}