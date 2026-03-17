import React, { useState, useEffect } from "react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { Bell, CheckCircle2, AlertCircle, Info, DollarSign, Users, Calendar, FileText, Loader2 } from "lucide-react";
import { notificationsApi } from "../../lib/api";
import { formatRelativeTime } from "../utils/formatters";
import { toast } from "sonner";

const NOTIFICATION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  bell: Bell,
  check: CheckCircle2,
  alert: AlertCircle,
  info: Info,
  dollar: DollarSign,
  users: Users,
  deadline: Calendar,
  task: CheckCircle2,
  lead: Users,
  invoice: FileText,
  payment: DollarSign,
  system: Info,
  other: Bell,
};

function getNotificationIcon(type: unknown): React.ComponentType<{ className?: string }> {
  if (typeof type === "string") {
    const key = type.toLowerCase();
    return NOTIFICATION_ICON_MAP[key] ?? Bell;
  }
  return Bell;
}

function notifyUnreadCountUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notifications-updated"));
  }
}

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch (e) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const res = await notificationsApi.markAllAsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      notifyUnreadCountUpdated();
      toast.success("All marked as read");
    } else {
      toast.error(res.error ?? "Failed to update");
    }
  };

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await notificationsApi.markAsRead(id);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        notifyUnreadCountUpdated();
      } else {
        toast.error(res.error ?? "Failed to update");
      }
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Notifications"
        description="Stay updated with your business activities"
      >
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={handleMarkAllRead}
          disabled={loading || notifications.every((n) => n.is_read)}
        >
          Mark all as read
        </Button>
      </PageHeader>

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <div className="w-full max-w-4xl mx-auto space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications</p>
                <p className="text-xs mt-2">Notifications will appear here</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type ?? notification.icon);
                const isUnread = notification.is_read === false || notification.read === false;
                const timeStr = notification.created_at
                  ? formatRelativeTime(notification.created_at)
                  : "";
                return (
                  <div
                    key={notification.id}
                    className={`bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                      isUnread ? "border-l-4 border-l-primary" : ""
                    }`}
                    onClick={() => isUnread && handleMarkRead(notification.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && isUnread && handleMarkRead(notification.id)}
                  >
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title ?? ""}</h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{timeStr}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message ?? ""}</p>
                      </div>
                      {isUnread && (
                        markingId === notification.id ? (
                          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 mt-2" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}