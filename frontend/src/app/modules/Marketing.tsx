import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { Card } from "../components/ui/card";
import { Eye, MousePointerClick, DollarSign, TrendingUp } from "lucide-react";
import { formatINR } from "../utils/formatters";

export function Marketing() {
  const campaigns = [
    { id: 1, name: "Summer Sale 2024", platform: "Meta", impressions: 45000, clicks: 2300, spent: 1200, roi: 3.5, status: "active" },
    { id: 2, name: "Product Launch", platform: "Google", impressions: 38000, clicks: 1890, spent: 980, roi: 4.2, status: "active" },
    { id: 3, name: "Brand Awareness", platform: "LinkedIn", impressions: 12000, clicks: 560, spent: 450, roi: 2.1, status: "paused" },
  ];

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Marketing"
        description="Track campaigns and marketing performance"
        action={{
          label: "New Campaign",
          onClick: () => {}
        }}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <MetricCard
              title="Total Impressions"
              value="95K"
              change={{ value: 15.3, positive: true }}
              icon={Eye}
              iconColor="text-foreground"
            />
            <MetricCard
              title="Total Clicks"
              value="4,750"
              change={{ value: 8.7, positive: true }}
              icon={MousePointerClick}
              iconColor="text-accent-foreground"
            />
            <MetricCard
              title="Ad Spend"
              value={formatINR(2630)}
              icon={DollarSign}
              iconColor="text-red-600"
            />
            <MetricCard
              title="Avg ROI"
              value="3.3x"
              change={{ value: 12.1, positive: true }}
              icon={TrendingUp}
              iconColor="text-emerald-600"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 text-sm font-medium text-muted-foreground">Campaign</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Platform</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Impressions</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Clicks</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Spent</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">ROI</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium text-sm">{campaign.name}</td>
                      <td className="p-4 text-sm">{campaign.platform}</td>
                      <td className="p-4 text-sm">{campaign.impressions.toLocaleString()}</td>
                      <td className="p-4 text-sm">{campaign.clicks.toLocaleString()}</td>
                      <td className="p-4 text-sm">{formatINR(campaign.spent)}</td>
                      <td className="p-4 text-sm font-medium text-emerald-600">{campaign.roi}x</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          campaign.status === "active" 
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}