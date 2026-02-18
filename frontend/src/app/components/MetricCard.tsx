import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "./ui/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  icon?: LucideIcon;
  iconColor?: string;
  subtitle?: string;
  highlight?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  iconColor = "text-foreground", 
  subtitle,
  highlight = false 
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        "group relative p-5 lg:p-6 rounded-2xl transition-all duration-300",
        highlight 
          ? "bg-foreground text-background shadow-lg hover:shadow-xl" 
          : "bg-card border border-border shadow-sm hover:shadow-md hover:border-muted-foreground/20"
      )}
    >
      {/* Decorative Accent */}
      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-3xl" />
      )}
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className={cn(
              "text-xs font-medium mb-1.5 uppercase tracking-wider",
              highlight ? "text-background/70" : "text-muted-foreground"
            )}>
              {title}
            </p>
            <h3 className={cn(
              "text-2xl lg:text-3xl font-medium tracking-tight",
              highlight ? "text-background" : "text-foreground"
            )}>
              {value}
            </h3>
          </div>
          
          {Icon && (
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              highlight 
                ? "bg-background/10 text-background" 
                : "bg-muted/50 group-hover:bg-muted",
              iconColor
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {subtitle && (
          <p className={cn(
            "text-xs mb-2",
            highlight ? "text-background/70" : "text-muted-foreground"
          )}>
            {subtitle}
          </p>
        )}

        {change && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            change.positive 
              ? highlight ? "text-background" : "text-success" 
              : highlight ? "text-background/80" : "text-destructive"
          )}>
            {change.positive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{change.positive ? '+' : ''}{change.value}%</span>
            <span className={cn(
              "ml-1",
              highlight ? "text-background/60" : "text-muted-foreground"
            )}>
              vs last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
