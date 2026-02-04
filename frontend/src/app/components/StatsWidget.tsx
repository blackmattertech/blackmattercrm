import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "./ui/utils";

interface StatsWidgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
}

export function StatsWidget({ title, value, icon: Icon, trend, subtitle, className }: StatsWidgetProps) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-semibold tracking-tight">{value}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs",
            trend.isPositive ? "text-emerald-600" : "text-red-600"
          )}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}
