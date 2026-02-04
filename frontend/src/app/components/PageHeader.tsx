import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, action, secondaryAction, searchPlaceholder, onSearch, children }: PageHeaderProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-medium mb-1">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {searchPlaceholder && (
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-9 rounded-xl"
                  onChange={(e) => onSearch?.(e.target.value)}
                />
              </div>
            )}
            {secondaryAction && (
              <Button variant="outline" size="sm" onClick={secondaryAction.onClick} className="rounded-xl">
                {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 mr-2" />}
                {secondaryAction.label}
              </Button>
            )}
            {action && (
              <Button size="sm" onClick={action.onClick} className="bg-foreground text-background hover:bg-foreground/90 rounded-xl whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                {action.label}
              </Button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}