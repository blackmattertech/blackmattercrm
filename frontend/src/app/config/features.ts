// Feature showcase component for highlighting key ERP features
import { LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export const erpFeatures: Feature[] = [
  {
    icon: require("lucide-react").LayoutDashboard,
    title: "Real-time Dashboard",
    description: "Monitor your entire business at a glance with live metrics and activity feeds",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: require("lucide-react").Users,
    title: "Smart CRM",
    description: "Track leads, manage relationships, and close deals faster with our intuitive pipeline",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: require("lucide-react").DollarSign,
    title: "Financial Control",
    description: "Complete accounting suite with invoicing, expense tracking, and financial reports",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: require("lucide-react").TrendingUp,
    title: "Analytics & Insights",
    description: "Make data-driven decisions with beautiful charts and actionable insights",
    color: "from-amber-500 to-orange-500"
  },
  {
    icon: require("lucide-react").Smartphone,
    title: "Mobile-First",
    description: "Full-featured experience on any device - phone, tablet, or desktop",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: require("lucide-react").Zap,
    title: "Fast & Efficient",
    description: "Quick actions, keyboard shortcuts, and optimized workflows for maximum productivity",
    color: "from-yellow-500 to-red-500"
  }
];
