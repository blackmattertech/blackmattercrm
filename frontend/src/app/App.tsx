import { useState, useEffect } from "react";
import { AppLayout, NavSection } from "./components/AppLayout";
import { QuickActions } from "./components/QuickActions";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./modules/Dashboard";
import { CRM } from "./modules/CRM";
import { Accounts } from "./modules/Accounts";
import { Products } from "./modules/Products";
import { Marketing } from "./modules/Marketing";
import { Blogs } from "./modules/Blogs";
import { Teams } from "./modules/Teams";
import { Notifications } from "./modules/Notifications";
import { Settings } from "./modules/Settings";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth.store";
import { LoadingState } from "./components/LoadingState";
import { api, notificationsApi } from "../lib/api";

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>("dashboard");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    // Initialize auth on mount - this loads from storage first
    const { initialize } = useAuthStore.getState();
    initialize();
    // On 401, clear session so app shows login
    api.setOnUnauthorized(() => useAuthStore.getState().logout({ skipServerCall: true, reason: 'api-401' }));
    // Fallback: ensure loading doesn't hang forever
    const timeout = setTimeout(() => {
      const { isLoading } = useAuthStore.getState();
      if (isLoading) {
        useAuthStore.setState({ isLoading: false });
      }
    }, 15000); // 15 second max loading time
    return () => clearTimeout(timeout);
  }, []); // Empty deps - only run once on mount

  const refreshUnreadCount = () => {
    if (!isAuthenticated) return;
    notificationsApi.getNotifications().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const unread = res.data.filter((n: { is_read?: boolean }) => !n.is_read).length;
        setUnreadNotificationCount(unread);
      }
    }).catch(() => setUnreadNotificationCount(0));
  };

  useEffect(() => {
    refreshUnreadCount();
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = () => refreshUnreadCount();
    window.addEventListener('notifications-updated', handler);
    return () => window.removeEventListener('notifications-updated', handler);
  }, [isAuthenticated]);

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <Dashboard />;
      case "crm":
        return <CRM />;
      case "accounts":
        return <Accounts />;
      case "products":
        return <Products />;
      case "marketing":
        return <Marketing />;
      case "blogs":
        return <Blogs />;
      case "teams":
        return <Teams />;
      case "notifications":
        return <Notifications />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const handleQuickAction = (action: string) => {
    // Navigate to appropriate section and show toast
    const actionMap: { [key: string]: { section: NavSection; message: string } } = {
      lead: { section: "crm", message: "Opening CRM to add new lead..." },
      invoice: { section: "accounts", message: "Opening Accounts to create invoice..." },
      expense: { section: "accounts", message: "Opening Accounts to log expense..." },
      product: { section: "products", message: "Opening Products to add new item..." },
      meeting: { section: "dashboard", message: "Opening calendar to schedule meeting..." }
    };

    const actionData = actionMap[action];
    if (actionData) {
      toast.success(actionData.message);
      setCurrentSection(actionData.section);
    }
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <>
        <LoadingState message="Loading..." />
        <Toaster />
      </>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  // Main app (authenticated)
  return (
    <>
      <AppLayout
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        notificationCount={unreadNotificationCount}
        user={user}
      >
        {renderSection()}
      </AppLayout>
      <QuickActions onAction={handleQuickAction} />
      <Toaster />
    </>
  );
}