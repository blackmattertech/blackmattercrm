import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mail, Calendar, DollarSign, Briefcase } from "lucide-react";
import { formatINR } from "../utils/formatters";

export function Teams() {
  const team = [
    { id: 1, name: "Sarah Johnson", role: "Designer", email: "sarah@example.com", status: "active" as const, projects: 8, earnings: 12500, availability: "Available" },
    { id: 2, name: "Mike Chen", role: "Developer", email: "mike@example.com", status: "active" as const, projects: 12, earnings: 18200, availability: "Busy" },
    { id: 3, name: "Emma Davis", role: "Marketing", email: "emma@example.com", status: "active" as const, projects: 5, earnings: 8400, availability: "Available" },
    { id: 4, name: "John Smith", role: "Sales", email: "john@example.com", status: "inactive" as const, projects: 3, earnings: 5200, availability: "On Leave" },
  ];

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
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => (
              <div key={member.id} className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center text-background text-xl font-medium">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1">{member.name}</h3>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                    <StatusBadge status={member.status} className="mt-2" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {member.email}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="w-4 h-4" />
                      <span>Projects</span>
                    </div>
                    <span className="font-medium">{member.projects}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>Earnings</span>
                    </div>
                    <span className="font-medium">{formatINR(member.earnings)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                    <span className={`font-medium ${member.availability === "Available" ? "text-emerald-600" : ""}`}>
                      {member.availability}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" size="sm">
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}