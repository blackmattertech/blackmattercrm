import { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { TeamDetail } from "../components/TeamDetail";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mail, Calendar, DollarSign, Briefcase, Loader2, UserPlus } from "lucide-react";
import { formatINR } from "../utils/formatters";
import { usersApi } from "../../lib/api";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  approval_status: string;
  is_director?: boolean;
  equity_ratio?: number;
  created_at: string;
  last_login_at?: string;
}

export function Teams() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getAllUsers();
      if (response.success && response.data) {
        // Filter to only show active, approved users
        const activeUsers = response.data.filter(
          (user: TeamMember) => user.is_active && user.approval_status === 'approved'
        );
        setTeam(activeUsers);
      }
    } catch (error) {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-soft-white dark:bg-background">
        <PageHeader
          title="Teams"
          description="Manage freelancers and team members"
        />
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (selectedMemberId) {
    return (
      <TeamDetail
        memberId={selectedMemberId}
        onBack={() => setSelectedMemberId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Teams"
        description="Manage freelancers and team members"
        searchPlaceholder="Search team members..."
        action={{
          label: "Add Member",
          onClick: () => {}
        }}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          {team.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No team members found</p>
              <p className="text-xs mt-2">Team members will appear here once they are added and approved</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name || member.email}
                        className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background text-xl font-medium">
                        {getInitials(member.full_name || member.email)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-lg mb-1">
                        {member.full_name || member.email.split("@")[0]}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{getRoleDisplay(member.role)}</p>
                        {member.is_director && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            Director {member.equity_ratio ? `(${member.equity_ratio}%)` : ''}
                          </span>
                        )}
                      </div>
                      <StatusBadge 
                        status={member.is_active ? "active" : "inactive"} 
                        className="mt-2" 
                      />
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-4 h-4">📞</span>
                        {member.phone}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Joined</span>
                      </div>
                      <span className="font-medium">
                        {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {member.last_login_at && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="w-4 h-4">🕐</span>
                          <span>Last Login</span>
                        </div>
                        <span className="font-medium">
                          {new Date(member.last_login_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      size="sm"
                      onClick={() => setSelectedMemberId(member.id)}
                    >
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
