import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { authApi, crmApi, usersApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Clock, Plus, Edit, Trash2, UserPlus } from "lucide-react";
import { CompanySetupPanel } from "./settings/CompanySetupPanel";

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approval_status: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  approval_status: string;
  created_at: string;
  last_login_at?: string;
}

type PaymentProvider = "cashfree" | "razorpay";
type EmailProvider = "mailjet" | "mailersend";

export function Settings() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  
  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedEmailProvider, setSelectedEmailProvider] = useState<EmailProvider | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [cashfreeConfig, setCashfreeConfig] = useState({
    appId: "",
    secretKey: "",
    webhookSecret: "",
    environment: "sandbox",
  });
  const [razorpayConfig, setRazorpayConfig] = useState({
    keyId: "",
    keySecret: "",
    webhookSecret: "",
    accountNumber: "",
    environment: "test",
  });
  const [mailjetConfig, setMailjetConfig] = useState({
    apiKey: "",
    secretKey: "",
    fromEmail: "",
    fromName: "",
  });
  const [mailersendConfig, setMailersendConfig] = useState({
    apiKey: "",
    fromEmail: "",
    fromName: "",
  });
  const [activePaymentProvider, setActivePaymentProvider] = useState("");
  const [activeEmailProvider, setActiveEmailProvider] = useState("");
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "sales",
    phone: "",
  });

  useEffect(() => {
    if (isAdmin) {
      loadPendingUsers();
      loadAllUsers();
      void loadPaymentConfig();
    }
  }, [isAdmin]);

  const loadPaymentConfig = async () => {
    try {
      const response = await crmApi.getPaymentConfig();
      if (!response.success || !response.data) return;
      const paymentConfig = response.data;
      if (paymentConfig.cashfree) {
        setCashfreeConfig({
          appId: paymentConfig.cashfree.appId || "",
          secretKey: paymentConfig.cashfree.secretKey || "",
          webhookSecret: paymentConfig.cashfree.webhookSecret || "",
          environment: paymentConfig.cashfree.environment || "sandbox",
        });
      }
      if (paymentConfig.razorpay) {
        setRazorpayConfig({
          keyId: paymentConfig.razorpay.keyId || "",
          keySecret: paymentConfig.razorpay.keySecret || "",
          webhookSecret: paymentConfig.razorpay.webhookSecret || "",
          accountNumber: paymentConfig.razorpay.accountNumber || "",
          environment: paymentConfig.razorpay.environment || "test",
        });
      }
      if (paymentConfig.mailjet) {
        setMailjetConfig({
          apiKey: paymentConfig.mailjet.apiKey || "",
          secretKey: paymentConfig.mailjet.secretKey || "",
          fromEmail: paymentConfig.mailjet.fromEmail || "",
          fromName: paymentConfig.mailjet.fromName || "",
        });
      }
      if (paymentConfig.mailersend) {
        setMailersendConfig({
          apiKey: paymentConfig.mailersend.apiKey || "",
          fromEmail: paymentConfig.mailersend.fromEmail || "",
          fromName: paymentConfig.mailersend.fromName || "",
        });
      }
      setActivePaymentProvider((paymentConfig.activeProviders?.payment || "").toLowerCase());
      setActiveEmailProvider((paymentConfig.activeProviders?.email || "").toLowerCase());
    } catch {
      // keep form defaults if fetch fails
    }
  };

  const loadPendingUsers = async () => {
    setLoading(true);
    try {
      const response = await authApi.getPendingUsers();
      if (response.success && response.data) {
        setPendingUsers(response.data);
      }
    } catch (error) {
      toast.error("Failed to load pending users");
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await usersApi.getAllUsers();
      if (response.success && response.data) {
        setAllUsers(response.data);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setApproving(userId);
    try {
      const response = await authApi.approveUser(userId);
      if (response.success) {
        toast.success("User approved successfully");
        loadPendingUsers();
        loadAllUsers();
      } else {
        toast.error(response.error || "Failed to approve user");
      }
    } catch (error) {
      toast.error("Failed to approve user");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    setApproving(userId);
    try {
      const response = await authApi.rejectUser(userId);
      if (response.success) {
        toast.success("User rejected");
        loadPendingUsers();
        loadAllUsers();
      } else {
        toast.error(response.error || "Failed to reject user");
      }
    } catch (error) {
      toast.error("Failed to reject user");
    } finally {
      setApproving(null);
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error("Email and password are required");
      return;
    }

    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await usersApi.createUser(createForm);
      if (response.success) {
        toast.success("User created successfully");
        setCreateDialogOpen(false);
        setCreateForm({ email: "", password: "", full_name: "", role: "sales", phone: "" });
        loadAllUsers();
      } else {
        toast.error(response.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await usersApi.updateUser(userId, updates);
      if (response.success) {
        toast.success("User updated successfully");
        setEditingUser(null);
        loadAllUsers();
      } else {
        toast.error(response.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await usersApi.deleteUser(userId);
      if (response.success) {
        toast.success("User deleted successfully");
        setDeleteConfirm(null);
        loadAllUsers();
      } else {
        toast.error(response.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await usersApi.updateUserRole(userId, newRole);
      if (response.success) {
        toast.success("Role updated successfully");
        loadAllUsers();
      } else {
        toast.error(response.error || "Failed to update role");
      }
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const openPaymentProviderForm = (provider: PaymentProvider) => {
    setSelectedPaymentProvider(provider);
    setPaymentDialogOpen(true);
  };

  const handleSavePaymentConfig = async () => {
    if (!selectedPaymentProvider) return;
    if (selectedPaymentProvider === "cashfree") {
      if (!cashfreeConfig.appId || !cashfreeConfig.secretKey || !cashfreeConfig.webhookSecret) {
        toast.error("Please fill all required Cashfree fields");
        return;
      }
      const response = await crmApi.savePaymentConfig("cashfree", {
        cashfree: cashfreeConfig,
      });
      if (!response.success) {
        toast.error(response.error || "Failed to save Cashfree configuration");
        return;
      }
      toast.success("Cashfree configuration saved to backend");
      setActivePaymentProvider("cashfree");
      setPaymentDialogOpen(false);
      return;
    }
    if (!razorpayConfig.keyId || !razorpayConfig.keySecret || !razorpayConfig.webhookSecret || !razorpayConfig.accountNumber) {
      toast.error("Please fill all required Razorpay fields");
      return;
    }
    const response = await crmApi.savePaymentConfig("razorpay", {
      razorpay: razorpayConfig,
    });
    if (!response.success) {
      toast.error(response.error || "Failed to save Razorpay configuration");
      return;
    }
    toast.success("Razorpay configuration saved to backend");
    setActivePaymentProvider("razorpay");
    setPaymentDialogOpen(false);
  };

  const openEmailProviderForm = (provider: EmailProvider) => {
    setSelectedEmailProvider(provider);
    setEmailDialogOpen(true);
  };

  const handleSaveEmailConfig = async () => {
    if (!selectedEmailProvider) return;

    if (selectedEmailProvider === "mailjet") {
      if (!mailjetConfig.apiKey || !mailjetConfig.secretKey || !mailjetConfig.fromEmail || !mailjetConfig.fromName) {
        toast.error("Please fill all required Mailjet fields");
        return;
      }
      const response = await crmApi.savePaymentConfig("mailjet", { mailjet: mailjetConfig });
      if (!response.success) {
        toast.error(response.error || "Failed to save Mailjet configuration");
        return;
      }
      toast.success("Mailjet configuration saved to backend");
      setActiveEmailProvider("mailjet");
      setEmailDialogOpen(false);
      return;
    }

    if (!mailersendConfig.apiKey || !mailersendConfig.fromEmail || !mailersendConfig.fromName) {
      toast.error("Please fill all required MailerSend fields");
      return;
    }
    const response = await crmApi.savePaymentConfig("mailersend", { mailersend: mailersendConfig });
    if (!response.success) {
      toast.error(response.error || "Failed to save MailerSend configuration");
      return;
    }
    toast.success("MailerSend configuration saved to backend");
    setActiveEmailProvider("mailersend");
    setEmailDialogOpen(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "sales":
        return "default";
      case "developers":
        return "secondary";
      case "designers":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="rounded-xl w-full justify-start flex-nowrap overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="users" className="rounded-lg data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:border-transparent">Users & Roles</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="pending" className="rounded-lg data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:border-transparent">
                  Pending Approvals
                  {pendingUsers.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingUsers.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="company" className="rounded-lg data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:border-transparent">Company</TabsTrigger>
              <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:border-transparent">Integrations</TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-lg data-[state=active]:!bg-black data-[state=active]:!text-white data-[state=active]:border-transparent">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-lg">Team Members</h3>
                  {isAdmin && (
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Create User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New User</DialogTitle>
                          <DialogDescription>
                            Create a new user account. They will be automatically approved.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="create-email">Email *</Label>
                            <Input
                              id="create-email"
                              type="email"
                              placeholder="user@example.com"
                              value={createForm.email}
                              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <Label htmlFor="create-password">Password *</Label>
                            <Input
                              id="create-password"
                              type="password"
                              placeholder="At least 6 characters"
                              value={createForm.password}
                              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <Label htmlFor="create-name">Full Name</Label>
                            <Input
                              id="create-name"
                              placeholder="John Doe"
                              value={createForm.full_name}
                              onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                              className="rounded-xl"
                            />
                          </div>
                          <div>
                            <Label htmlFor="create-role">Role</Label>
                            <Select
                              value={createForm.role}
                              onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="developers">Developers</SelectItem>
                                <SelectItem value="designers">Designers</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="create-phone">Phone</Label>
                            <Input
                              id="create-phone"
                              type="tel"
                              placeholder="+1 234 567 8900"
                              value={createForm.phone}
                              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                              className="rounded-xl"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-xl">
                            Cancel
                          </Button>
                          <Button onClick={handleCreateUser} className="rounded-xl">
                            Create User
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allUsers.map((userItem) => (
                      <div
                        key={userItem.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {userItem.full_name || "No name"}
                            </p>
                            <Badge variant={getRoleBadgeVariant(userItem.role)} className="text-xs">
                              {userItem.role}
                            </Badge>
                            {!userItem.is_active && (
                              <Badge variant="outline" className="text-xs">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{userItem.email}</p>
                          {userItem.phone && (
                            <p className="text-xs text-muted-foreground">{userItem.phone}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined: {new Date(userItem.created_at).toLocaleDateString()}
                            {userItem.last_login_at && (
                              <> • Last login: {new Date(userItem.last_login_at).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <Select
                              value={userItem.role}
                              onValueChange={(value) => handleRoleChange(userItem.id, value)}
                            >
                              <SelectTrigger className="w-32 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="developers">Developers</SelectItem>
                                <SelectItem value="designers">Designers</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingUser(userItem)}
                              className="rounded-xl"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {userItem.id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirm(userItem.id)}
                                className="rounded-xl text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="pending" className="mt-6">
                <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium text-lg">Pending User Approvals</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        loadPendingUsers();
                        loadAllUsers();
                      }}
                      disabled={loading}
                      className="rounded-xl"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Refresh"
                      )}
                    </Button>
                  </div>
                  {loading && pendingUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : pendingUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No pending approvals</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingUsers.map((pendingUser) => (
                        <div
                          key={pendingUser.id}
                          className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">
                                {pendingUser.full_name || "No name"}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {pendingUser.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{pendingUser.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Requested: {new Date(pendingUser.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(pendingUser.id)}
                              disabled={approving === pendingUser.id}
                              className="rounded-xl"
                            >
                              {approving === pendingUser.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(pendingUser.id)}
                              disabled={approving === pendingUser.id}
                              className="rounded-xl"
                            >
                              {approving === pendingUser.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Approve
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Edit User Dialog */}
            {editingUser && (
              <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                      Update user information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Email</Label>
                      <Input value={editingUser.email} disabled className="rounded-xl" />
                    </div>
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        value={editingUser.full_name || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editingUser.phone || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Active Status</Label>
                      <Switch
                        checked={editingUser.is_active}
                        onCheckedChange={(checked) => setEditingUser({ ...editingUser, is_active: checked })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingUser(null)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleUpdateUser(editingUser.id, {
                        full_name: editingUser.full_name,
                        phone: editingUser.phone,
                        is_active: editingUser.is_active,
                      })}
                      className="rounded-xl"
                    >
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
              <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this user? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteUser(deleteConfirm)}
                      className="rounded-xl"
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <TabsContent value="company" className="mt-6">
              <CompanySetupPanel />
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-6">API Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  <div
                    className="relative h-[230px] w-[280px] cursor-pointer [perspective:1000px] justify-self-start"
                  >
                    <div className="absolute bottom-0 h-[200px] w-[280px] rounded-[22px_22px_60px_60px] bg-black z-[5] shadow-[inset_0_25px_35px_rgba(255,255,255,0.05),inset_0_5px_15px_rgba(0,0,0,0.8)]" />

                    <button
                      onClick={() => openPaymentProviderForm("cashfree")}
                      className={`group absolute left-[10px] h-[140px] w-[260px] rounded-2xl bg-[#00b894] p-4 text-left text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_-4px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:z-[100] hover:scale-105 hover:!translate-y-[-52px] ${
                        activePaymentProvider === "cashfree"
                          ? "bottom-[40px] z-[25]"
                          : activePaymentProvider
                          ? "bottom-[82px] z-[10]"
                          : "bottom-[82px] z-[10]"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                          <span>Cashfree</span>
                          <div className="flex items-center gap-2">
                            {activePaymentProvider === "cashfree" ? (
                              <span className="rounded-full bg-[#1EC57A] px-2 py-0.5 text-[10px] font-semibold text-black normal-case">
                                Active
                              </span>
                            ) : null}
                            <div className="h-6 w-8 rounded border border-white/30 bg-white/20" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="block text-[10px] uppercase opacity-70">Gateway</span>
                            <span className="text-xs font-medium">Business Account</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm tracking-[2px] group-hover:hidden">**** 1192</span>
                            <span className="hidden font-mono text-sm tracking-wide group-hover:block">CF PG LIVE</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => openPaymentProviderForm("razorpay")}
                      className={`group absolute left-[10px] h-[140px] w-[260px] rounded-2xl bg-[#2b6de0] p-4 text-left text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_-4px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:z-[100] hover:scale-105 hover:!translate-y-[-52px] ${
                        activePaymentProvider === "razorpay"
                          ? "bottom-[40px] z-[25]"
                          : activePaymentProvider
                          ? "bottom-[82px] z-[10]"
                          : "bottom-[40px] z-[20]"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                          <span>Razorpay</span>
                          <div className="flex items-center gap-2">
                            {activePaymentProvider === "razorpay" ? (
                              <span className="rounded-full bg-[#1EC57A] px-2 py-0.5 text-[10px] font-semibold text-black normal-case">
                                Active
                              </span>
                            ) : null}
                            <div className="h-6 w-8 rounded border border-white/30 bg-white/20" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="block text-[10px] uppercase opacity-70">Gateway</span>
                            <span className="text-xs font-medium">Business Account</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm tracking-[2px] group-hover:hidden">**** 7648</span>
                            <span className="hidden font-mono text-sm tracking-wide group-hover:block">RP KEY LIVE</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="absolute bottom-0 z-[30] h-[160px] w-[280px]">
                      <svg className="h-full w-full" viewBox="0 0 280 160" fill="none">
                        <path
                          d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z"
                          fill="#000000"
                        />
                        <path
                          d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z"
                          stroke="#2d2d2d"
                          strokeWidth="1.5"
                          strokeDasharray="6 4"
                        />
                      </svg>
                      <div className="pointer-events-none absolute inset-x-0 top-11 text-center">
                        <p className="text-[22px] font-semibold text-[#1EC57A]">Payment Integration</p>
                        <p className="mt-1 text-xs font-medium text-[#698263]">Click a card to configure</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-[230px] w-[280px] cursor-pointer [perspective:1000px] justify-self-start">
                    <div className="absolute bottom-0 h-[200px] w-[280px] rounded-[22px_22px_60px_60px] bg-black z-[5] shadow-[inset_0_25px_35px_rgba(255,255,255,0.05),inset_0_5px_15px_rgba(0,0,0,0.8)]" />

                    <button
                      onClick={() => openEmailProviderForm("mailjet")}
                      className={`group absolute left-[10px] h-[140px] w-[260px] rounded-2xl bg-[#f27121] p-4 text-left text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_-4px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:z-[100] hover:scale-105 hover:!translate-y-[-52px] ${
                        activeEmailProvider === "mailjet"
                          ? "bottom-[40px] z-[25]"
                          : activeEmailProvider
                          ? "bottom-[82px] z-[10]"
                          : "bottom-[82px] z-[10]"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                          <span>Mailjet</span>
                          <div className="flex items-center gap-2">
                            {activeEmailProvider === "mailjet" ? (
                              <span className="rounded-full bg-[#1EC57A] px-2 py-0.5 text-[10px] font-semibold text-black normal-case">
                                Active
                              </span>
                            ) : null}
                            <div className="h-6 w-8 rounded border border-white/30 bg-white/20" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="block text-[10px] uppercase opacity-70">Email</span>
                            <span className="text-xs font-medium">Transactional</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm tracking-[2px] group-hover:hidden">**** MJ</span>
                            <span className="hidden font-mono text-sm tracking-wide group-hover:block">SMTP / API</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => openEmailProviderForm("mailersend")}
                      className={`group absolute left-[10px] h-[140px] w-[260px] rounded-2xl bg-[#4f46e5] p-4 text-left text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_-4px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 hover:z-[100] hover:scale-105 hover:!translate-y-[-52px] ${
                        activeEmailProvider === "mailersend"
                          ? "bottom-[40px] z-[25]"
                          : activeEmailProvider
                          ? "bottom-[82px] z-[10]"
                          : "bottom-[40px] z-[20]"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between text-sm uppercase tracking-wide">
                          <span>MailerSend</span>
                          <div className="flex items-center gap-2">
                            {activeEmailProvider === "mailersend" ? (
                              <span className="rounded-full bg-[#1EC57A] px-2 py-0.5 text-[10px] font-semibold text-black normal-case">
                                Active
                              </span>
                            ) : null}
                            <div className="h-6 w-8 rounded border border-white/30 bg-white/20" />
                          </div>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <span className="block text-[10px] uppercase opacity-70">Email</span>
                            <span className="text-xs font-medium">Transactional</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm tracking-[2px] group-hover:hidden">**** MS</span>
                            <span className="hidden font-mono text-sm tracking-wide group-hover:block">API ONLY</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="absolute bottom-0 z-[30] h-[160px] w-[280px]">
                      <svg className="h-full w-full" viewBox="0 0 280 160" fill="none">
                        <path d="M 0 20 C 0 10, 5 10, 10 10 C 20 10, 25 25, 40 25 L 240 25 C 255 25, 260 10, 270 10 C 275 10, 280 10, 280 20 L 280 120 C 280 155, 260 160, 240 160 L 40 160 C 20 160, 0 155, 0 120 Z" fill="#000000" />
                        <path d="M 8 22 C 8 16, 12 16, 15 16 C 23 16, 27 29, 40 29 L 240 29 C 253 29, 257 16, 265 16 C 268 16, 272 16, 272 22 L 272 120 C 272 150, 255 152, 240 152 L 40 152 C 25 152, 8 152, 8 120 Z" stroke="#2d2d2d" strokeWidth="1.5" strokeDasharray="6 4" />
                      </svg>
                      <div className="pointer-events-none absolute inset-x-0 top-11 text-center">
                        <p className="text-[22px] font-semibold text-[#1EC57A]">Email Integration</p>
                        <p className="mt-1 text-xs font-medium text-[#698263]">Click a card to configure</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[230px] w-[280px] rounded-2xl border border-dashed border-[#d9d9d9] bg-muted/20 p-5 justify-self-start">
                    <h4 className="text-base font-medium">More Integrations</h4>
                    <p className="mt-2 text-sm text-muted-foreground">This column is reserved for the next integration category.</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogContent className="rounded-2xl sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedPaymentProvider === "cashfree" ? "Configure Cashfree" : "Configure Razorpay"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill required credentials to connect the payment gateway.
                  </DialogDescription>
                </DialogHeader>

                {selectedPaymentProvider === "cashfree" ? (
                  <div className="grid grid-cols-1 gap-4 py-2">
                    <div>
                      <Label htmlFor="cashfree-app-id">App ID *</Label>
                      <Input
                        id="cashfree-app-id"
                        className="rounded-xl"
                        value={cashfreeConfig.appId}
                        onChange={(e) => setCashfreeConfig((prev) => ({ ...prev, appId: e.target.value }))}
                        placeholder="Enter Cashfree App ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cashfree-secret-key">Secret Key *</Label>
                      <Input
                        id="cashfree-secret-key"
                        className="rounded-xl"
                        value={cashfreeConfig.secretKey}
                        onChange={(e) => setCashfreeConfig((prev) => ({ ...prev, secretKey: e.target.value }))}
                        placeholder="Enter Cashfree Secret Key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cashfree-webhook-secret">Webhook Secret *</Label>
                      <Input
                        id="cashfree-webhook-secret"
                        className="rounded-xl"
                        value={cashfreeConfig.webhookSecret}
                        onChange={(e) => setCashfreeConfig((prev) => ({ ...prev, webhookSecret: e.target.value }))}
                        placeholder="Enter Cashfree Webhook Secret"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cashfree-env">Environment *</Label>
                      <Select
                        value={cashfreeConfig.environment}
                        onValueChange={(value) => setCashfreeConfig((prev) => ({ ...prev, environment: value }))}
                      >
                        <SelectTrigger id="cashfree-env" className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 py-2">
                    <div>
                      <Label htmlFor="razorpay-key-id">Key ID *</Label>
                      <Input
                        id="razorpay-key-id"
                        className="rounded-xl"
                        value={razorpayConfig.keyId}
                        onChange={(e) => setRazorpayConfig((prev) => ({ ...prev, keyId: e.target.value }))}
                        placeholder="Enter Razorpay Key ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="razorpay-key-secret">Key Secret *</Label>
                      <Input
                        id="razorpay-key-secret"
                        className="rounded-xl"
                        value={razorpayConfig.keySecret}
                        onChange={(e) => setRazorpayConfig((prev) => ({ ...prev, keySecret: e.target.value }))}
                        placeholder="Enter Razorpay Key Secret"
                      />
                    </div>
                    <div>
                      <Label htmlFor="razorpay-webhook-secret">Webhook Secret *</Label>
                      <Input
                        id="razorpay-webhook-secret"
                        className="rounded-xl"
                        value={razorpayConfig.webhookSecret}
                        onChange={(e) => setRazorpayConfig((prev) => ({ ...prev, webhookSecret: e.target.value }))}
                        placeholder="Enter Razorpay Webhook Secret"
                      />
                    </div>
                    <div>
                      <Label htmlFor="razorpay-account-number">Account Number *</Label>
                      <Input
                        id="razorpay-account-number"
                        className="rounded-xl"
                        value={razorpayConfig.accountNumber}
                        onChange={(e) => setRazorpayConfig((prev) => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="Enter Razorpay Account Number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="razorpay-env">Environment *</Label>
                      <Select
                        value={razorpayConfig.environment}
                        onValueChange={(value) => setRazorpayConfig((prev) => ({ ...prev, environment: value }))}
                      >
                        <SelectTrigger id="razorpay-env" className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="test">Test</SelectItem>
                          <SelectItem value="live">Live</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" className="rounded-xl" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl" onClick={handleSavePaymentConfig}>
                    Save Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogContent className="rounded-2xl sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedEmailProvider === "mailjet" ? "Configure Mailjet" : "Configure MailerSend"}
                  </DialogTitle>
                  <DialogDescription>
                    Fill required credentials to connect the email provider.
                  </DialogDescription>
                </DialogHeader>

                {selectedEmailProvider === "mailjet" ? (
                  <div className="grid grid-cols-1 gap-4 py-2">
                    <div>
                      <Label htmlFor="mailjet-api-key">API Key *</Label>
                      <Input id="mailjet-api-key" className="rounded-xl" value={mailjetConfig.apiKey} onChange={(e) => setMailjetConfig((prev) => ({ ...prev, apiKey: e.target.value }))} placeholder="Enter Mailjet API Key" />
                    </div>
                    <div>
                      <Label htmlFor="mailjet-secret-key">Secret Key *</Label>
                      <Input id="mailjet-secret-key" className="rounded-xl" value={mailjetConfig.secretKey} onChange={(e) => setMailjetConfig((prev) => ({ ...prev, secretKey: e.target.value }))} placeholder="Enter Mailjet Secret Key" />
                    </div>
                    <div>
                      <Label htmlFor="mailjet-from-email">From Email *</Label>
                      <Input id="mailjet-from-email" className="rounded-xl" value={mailjetConfig.fromEmail} onChange={(e) => setMailjetConfig((prev) => ({ ...prev, fromEmail: e.target.value }))} placeholder="noreply@yourdomain.com" />
                    </div>
                    <div>
                      <Label htmlFor="mailjet-from-name">From Name *</Label>
                      <Input id="mailjet-from-name" className="rounded-xl" value={mailjetConfig.fromName} onChange={(e) => setMailjetConfig((prev) => ({ ...prev, fromName: e.target.value }))} placeholder="BlackMatter CRM" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 py-2">
                    <div>
                      <Label htmlFor="mailersend-api-key">API Key *</Label>
                      <Input id="mailersend-api-key" className="rounded-xl" value={mailersendConfig.apiKey} onChange={(e) => setMailersendConfig((prev) => ({ ...prev, apiKey: e.target.value }))} placeholder="Enter MailerSend API Key" />
                    </div>
                    <div>
                      <Label htmlFor="mailersend-from-email">From Email *</Label>
                      <Input id="mailersend-from-email" className="rounded-xl" value={mailersendConfig.fromEmail} onChange={(e) => setMailersendConfig((prev) => ({ ...prev, fromEmail: e.target.value }))} placeholder="noreply@yourdomain.com" />
                    </div>
                    <div>
                      <Label htmlFor="mailersend-from-name">From Name *</Label>
                      <Input id="mailersend-from-name" className="rounded-xl" value={mailersendConfig.fromName} onChange={(e) => setMailersendConfig((prev) => ({ ...prev, fromName: e.target.value }))} placeholder="BlackMatter CRM" />
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" className="rounded-xl" onClick={() => setEmailDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="rounded-xl" onClick={handleSaveEmailConfig}>
                    Save Configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <TabsContent value="preferences" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-6">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    "Email notifications for new leads",
                    "Payment reminders",
                    "Weekly summary reports",
                    "Team activity updates"
                  ].map((pref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <p className="text-sm">{pref}</p>
                      <Switch defaultChecked={idx < 2} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
