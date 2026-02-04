import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bell, CheckCircle2, AlertCircle, Info, DollarSign, Users } from "lucide-react";
import { formatINRCompact } from "../utils/formatters";

export function Notifications() {
  const notifications = [
    { id: 1, type: "payment", title: "Payment received", message: `Invoice INV-2024-001 has been paid - ${formatINRCompact(5200)}`, time: "2 mins ago", read: false, icon: DollarSign, iconColor: "text-emerald-600" },
    { id: 2, type: "alert", title: "Payment overdue", message: "Invoice INV-2024-056 is now 5 days overdue", time: "1 hour ago", read: false, icon: AlertCircle, iconColor: "text-red-600" },
    { id: 3, type: "success", title: "Project completed", message: "Website Redesign has been marked as complete", time: "3 hours ago", read: false, icon: CheckCircle2, iconColor: "text-emerald-600" },
    { id: 4, type: "info", title: "New lead added", message: "John Smith from Tech Corp has been added to CRM", time: "5 hours ago", read: true, icon: Users, iconColor: "text-foreground" },
    { id: 5, type: "info", title: "Team member available", message: "Sarah Johnson is now available for new projects", time: "1 day ago", read: true, icon: Info, iconColor: "text-foreground" },
  ];

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Notifications"
        description="Stay updated with your business activities"
      >
        <Button variant="outline" size="sm" className="rounded-xl">
          Mark all as read
        </Button>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <div className="w-full max-w-4xl mx-auto space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    !notification.read ? "border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 ${notification.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}