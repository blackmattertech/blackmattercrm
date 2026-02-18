import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  Megaphone,
  UserSquare2,
  Bell,
  Settings,
  Sun,
  Moon,
  Menu,
  Search,
  LogOut
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { NavSection } from "./AppLayout";
import { User } from "../../store/auth.store";
import { useAuthStore } from "../../store/auth.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface TopHeaderProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  notificationCount?: number;
  onMenuClick: () => void;
  user?: User | null;
}

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { id: "crm" as const, label: "CRM", icon: Users },
  { id: "accounts" as const, label: "Accounts", icon: DollarSign },
  { id: "products" as const, label: "Products", icon: Package },
  { id: "marketing" as const, label: "Marketing", icon: Megaphone },
  { id: "teams" as const, label: "Teams", icon: UserSquare2 },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function TopHeader({ currentSection, onNavigate, notificationCount = 0, onMenuClick, user: userProp }: TopHeaderProps) {
  const [darkMode, setDarkMode] = useState(false);
  const { logout, user: authUser } = useAuthStore();
  
  // Use auth store user as primary source, fallback to prop
  const user = authUser || userProp;

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    return user?.full_name || user?.email || 'User';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="lg:hidden -ml-2 p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img 
              src="/scissorlogo.png" 
              alt="BlackMatter ERP" 
              className="w-8 h-8 object-contain"
            />
            <span className="hidden sm:inline-block font-medium text-lg">ERP</span>
          </div>
        </div>

        {/* Center Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex rounded-full hover:bg-muted"
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-muted"
            onClick={() => onNavigate("notifications")}
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium">
                {notificationCount}
              </span>
            )}
          </Button>

          {/* Theme Toggle - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="hidden md:flex rounded-full hover:bg-muted"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-muted transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-logo-primary to-logo-light flex items-center justify-center">
                  <span className="text-xs font-semibold text-foreground">{getUserInitials()}</span>
                </div>
                <span className="hidden lg:inline-block text-sm font-medium">{getUserDisplayName()}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground">{user?.role || 'User'}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}