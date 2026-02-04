import {
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  Megaphone,
  UserSquare2,
  Bell,
  Settings,
  X,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { NavSection } from "./AppLayout";
import { useState } from "react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  notificationCount?: number;
}

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "crm" as const, label: "CRM", icon: Users },
  { id: "accounts" as const, label: "Accounts", icon: DollarSign },
  { id: "products" as const, label: "Products", icon: Package },
  { id: "marketing" as const, label: "Marketing", icon: Megaphone },
  { id: "teams" as const, label: "Teams", icon: UserSquare2 },
  { id: "notifications" as const, label: "Notifications", icon: Bell },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function MobileMenu({ isOpen, onClose, currentSection, onNavigate, notificationCount = 0 }: MobileMenuProps) {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleNavigate = (section: NavSection) => {
    onNavigate(section);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed inset-y-0 left-0 w-80 bg-card border-r z-50 lg:hidden shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="font-semibold text-lg">Menu</h2>
              <p className="text-xs text-muted-foreground mt-1">Navigate your workspace</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-auto p-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                const showBadge = item.id === "notifications" && notificationCount > 0;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-foreground text-background shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {showBadge && (
                      <span className="bg-accent text-accent-foreground text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center font-medium">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </Button>
            
            <div className="px-4 py-3 rounded-xl bg-muted">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Director</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
