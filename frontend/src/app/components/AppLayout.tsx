import { useState, ReactNode } from "react";
import { TopHeader } from "./TopHeader";
import { MobileMenu } from "./MobileMenu";
import { User } from "../../store/auth.store";

export type NavSection = "dashboard" | "crm" | "accounts" | "products" | "marketing" | "teams" | "notifications" | "settings";

interface AppLayoutProps {
  children: ReactNode;
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  notificationCount?: number;
  user?: User | null;
}

export function AppLayout({ children, currentSection, onNavigate, notificationCount = 0, user }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Top Header */}
      <TopHeader
        currentSection={currentSection}
        onNavigate={onNavigate}
        notificationCount={notificationCount}
        onMenuClick={() => setMobileMenuOpen(true)}
        user={user}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentSection={currentSection}
        onNavigate={onNavigate}
        notificationCount={notificationCount}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
