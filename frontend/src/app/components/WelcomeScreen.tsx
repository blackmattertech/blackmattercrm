import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp,
  Zap,
  Shield,
  Smartphone,
  X
} from "lucide-react";

interface WelcomeScreenProps {
  onClose: () => void;
}

export function WelcomeScreen({ onClose }: WelcomeScreenProps) {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Unified Dashboard",
      description: "Real-time overview of your entire business in one place"
    },
    {
      icon: Users,
      title: "CRM & Pipeline",
      description: "Manage leads, track deals, and close more sales"
    },
    {
      icon: DollarSign,
      title: "Financial Management",
      description: "Invoices, expenses, and financial reporting made simple"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Insights",
      description: "Data-driven insights to grow your business"
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Full-featured experience on any device"
    },
    {
      icon: Shield,
      title: "Enterprise Grade",
      description: "Secure, scalable, and built for growth"
    }
  ];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
      <Card className="max-w-4xl w-full p-8 lg:p-12 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Welcome to ERP System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your complete business management platform. Streamline operations, track performance, and grow your business with confidence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted mb-4">
                  <Icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onClose} className="text-lg px-8">
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={onClose} className="text-lg px-8">
            Take a Tour
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>💡 Tip: Use the Quick Actions button (bottom right) for fast access to common tasks</p>
        </div>
      </Card>
    </div>
  );
}
