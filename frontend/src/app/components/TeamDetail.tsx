import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Edit,
  Save,
  X,
  Upload,
  Loader2,
  Briefcase,
  Percent,
  Crown,
} from "lucide-react";
import { usersApi } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "sonner";
import { formatDate } from "../utils/formatters";

interface TeamMember {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  approval_status: string;
  is_director?: boolean;
  equity_ratio?: number;
  created_at: string;
  last_login_at?: string;
}

interface TeamDetailProps {
  memberId: string;
  onBack: () => void;
}

export function TeamDetail({ memberId, onBack }: TeamDetailProps) {
  const { user: currentUser } = useAuthStore();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    is_director: false,
    equity_ratio: 0,
  });

  const isAdmin = currentUser?.role === "admin";
  const canEdit = isAdmin || currentUser?.id === memberId;

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getUser(memberId);
      if (response.success && response.data) {
        setMember(response.data);
        setFormData({
          full_name: response.data.full_name || "",
          phone: response.data.phone || "",
          is_director: response.data.is_director || false,
          equity_ratio: response.data.equity_ratio || 0,
        });
      } else {
        toast.error("Failed to load member details");
        onBack();
      }
    } catch (error) {
      toast.error("Failed to load member details");
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update profile (full_name, phone)
      await usersApi.updateUserProfile(memberId, {
        full_name: formData.full_name,
        phone: formData.phone,
      });

      // Update director status if admin
      if (isAdmin && (formData.is_director !== member?.is_director || formData.equity_ratio !== member?.equity_ratio)) {
        await usersApi.updateDirectorStatus(memberId, {
          is_director: formData.is_director,
          equity_ratio: formData.equity_ratio,
        });
      }

      toast.success("Profile updated successfully");
      setEditing(false);
      loadMember();
    } catch (error: any) {
      toast.error(error?.error || "Failed to update profile");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const response = await usersApi.uploadAvatar(memberId, file);
      if (response.success) {
        toast.success("Avatar uploaded successfully");
        loadMember();
      } else {
        toast.error("Failed to upload avatar");
      }
    } catch (error: any) {
      toast.error(error?.error || "Failed to upload avatar");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: "Admin",
      sales: "Sales",
      developers: "Developer",
      designers: "Designer",
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" onClick={onBack} className="mb-4 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12 text-muted-foreground">
            <p>Member not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Teams
            </Button>
            {canEdit && (
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          full_name: member.full_name || "",
                          phone: member.phone || "",
                          is_director: member.is_director || false,
                          equity_ratio: member.equity_ratio || 0,
                        });
                      }}
                      className="rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="rounded-xl">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditing(true)} className="rounded-xl">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Profile Card */}
          <Card className="p-6 lg:p-8 rounded-2xl">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name || member.email}
                      className="w-32 h-32 rounded-full object-cover border-4 border-border"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background text-4xl font-medium border-4 border-border">
                      {getInitials(member.full_name || member.email)}
                    </div>
                  )}
                  {canEdit && (
                    <label className="absolute bottom-0 right-0 bg-foreground text-background rounded-full p-2 cursor-pointer hover:bg-foreground/90 transition-colors">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
                {uploading && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-medium mb-2">
                    {editing ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) =>
                          setFormData({ ...formData, full_name: e.target.value })
                        }
                        placeholder="Full Name"
                        className="text-3xl font-medium"
                      />
                    ) : (
                      member.full_name || member.email.split("@")[0]
                    )}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{getRoleDisplay(member.role)}</span>
                    {member.is_director && (
                      <>
                        <Crown className="w-4 h-4 text-amber-600 ml-2" />
                        <span className="text-amber-600">Director</span>
                        {member.equity_ratio && (
                          <span className="text-amber-600">
                            ({member.equity_ratio}% equity)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      {editing ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="Phone Number"
                        />
                      ) : (
                        <p className="font-medium">{member.phone || "Not provided"}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined</p>
                      <p className="font-medium">
                        {formatDate(member.created_at)}
                      </p>
                    </div>
                  </div>

                  {member.last_login_at && (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last Login</p>
                        <p className="font-medium">
                          {formatDate(member.last_login_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Director Settings (Admin Only) */}
                {isAdmin && (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Director Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_director"
                          checked={editing ? formData.is_director : member.is_director || false}
                          onChange={(e) =>
                            editing
                              ? setFormData({
                                  ...formData,
                                  is_director: e.target.checked,
                                  equity_ratio: e.target.checked ? formData.equity_ratio : 0,
                                })
                              : undefined
                          }
                          disabled={!editing}
                          className="rounded"
                        />
                        <Label htmlFor="is_director" className="cursor-pointer">
                          Mark as Director
                        </Label>
                      </div>
                      {formData.is_director && editing && (
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.equity_ratio}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                equity_ratio: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="Equity %"
                            className="w-32"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                      {member.is_director && !editing && member.equity_ratio && (
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{member.equity_ratio}% Equity</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
