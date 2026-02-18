import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { authApi, usersApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Clock, Plus, Edit, Trash2, UserPlus } from "lucide-react";

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
  
  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
    }
  }, [isAdmin]);

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
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <Tabs defaultValue="users" className="w-full max-w-4xl mx-auto">
            <TabsList className="rounded-xl">
              <TabsTrigger value="users" className="rounded-lg">Users & Roles</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="pending" className="rounded-lg">
                  Pending Approvals
                  {pendingUsers.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingUsers.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="company" className="rounded-lg">Company</TabsTrigger>
              <TabsTrigger value="integrations" className="rounded-lg">Integrations</TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-lg">Preferences</TabsTrigger>
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
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-6">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="Acme Corporation" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="info@company.com" className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="+1 234 567 8900" className="rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Business St, City, Country" className="rounded-xl" />
                  </div>
                  <Button className="rounded-xl">Save Changes</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-6">API Integrations</h3>
                <div className="space-y-3">
                  {[
                    { name: "Stripe", status: true },
                    { name: "Google Workspace", status: true },
                    { name: "Slack", status: false },
                    { name: "Mailchimp", status: false }
                  ].map((integration, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {integration.status ? "Connected" : "Not connected"}
                        </p>
                      </div>
                      <Switch checked={integration.status} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

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
