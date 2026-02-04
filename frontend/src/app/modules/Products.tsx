import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Package, Calendar, DollarSign } from "lucide-react";
import { formatINR } from "../utils/formatters";

export function Products() {
  const products = [
    { id: 1, name: "Website Design", type: "Service", price: 5000, billing: "One-time", status: "active" as const },
    { id: 2, name: "Pro Plan", type: "Subscription", price: 99, billing: "Monthly", status: "active" as const, subscribers: 45 },
    { id: 3, name: "Enterprise Plan", type: "Subscription", price: 499, billing: "Monthly", status: "active" as const, subscribers: 12 },
    { id: 4, name: "Consulting", type: "Service", price: 150, billing: "Hourly", status: "active" as const },
  ];

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Products & Services"
        description="Manage your products, services, and subscriptions"
        searchPlaceholder="Search products..."
        action={{
          label: "Add Product",
          onClick: () => {}
        }}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center">
                    <Package className="w-6 h-6 text-background" />
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                <h3 className="font-medium text-lg mb-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{product.type}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">{formatINR(product.price)}/{product.billing}</span>
                  </div>
                  {product.subscribers && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subscribers</span>
                      <span className="font-medium">{product.subscribers}</span>
                    </div>
                  )}
                </div>
                <Button className="w-full mt-4 rounded-xl" variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}