import { useState, useEffect } from "react";
import { AppLayout, NavSection } from "./components/AppLayout";
import { QuickActions } from "./components/QuickActions";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./modules/Dashboard";
import { CRM } from "./modules/CRM";
import { Accounts } from "./modules/Accounts";
import { Products } from "./modules/Products";
import { Marketing } from "./modules/Marketing";
import { Teams } from "./modules/Teams";
import { Notifications } from "./modules/Notifications";
import { Settings } from "./modules/Settings";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { useAuthStore } from "../store/auth.store";
import { LoadingState } from "./components/LoadingState";

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>("dashboard");
  const [showWelcome, setShowWelcome] = useState(false);
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();

  useEffect(() => {
    // Check authentication on mount
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Show welcome screen on first visit (only if authenticated)
    if (isAuthenticated) {
      const hasVisited = localStorage.getItem("erp_has_visited");
      if (!hasVisited) {
        setShowWelcome(true);
      }
    }
  }, [isAuthenticated]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("erp_has_visited", "true");
    toast.success("Welcome! Let's get started.");
  };

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
      {showWelcome && <WelcomeScreen onClose={handleCloseWelcome} />}
      <AppLayout
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        notificationCount={3}
        user={user}
      >
        {renderSection()}
      </AppLayout>
      <QuickActions onAction={handleQuickAction} />
      <Toaster />
    </>
  );
}