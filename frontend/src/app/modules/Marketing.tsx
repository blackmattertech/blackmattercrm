import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { Card } from "../components/ui/card";
import { Eye, MousePointerClick, DollarSign, TrendingUp } from "lucide-react";
import { formatINR, formatDate } from "../utils/formatters";

export function Marketing() {
  // Empty array - will be populated from API when marketing endpoints are implemented
  const campaigns: any[] = [];

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
              value="—"
              icon={Eye}
              subtitle="No data available"
              highlight={true}
            />
            <MetricCard
              title="Total Clicks"
              value="—"
              icon={MousePointerClick}
              subtitle="No data available"
            />
            <MetricCard
              title="Ad Spend"
              value="—"
              icon={DollarSign}
              subtitle="No data available"
            />
            <MetricCard
              title="Avg ROI"
              value="—"
              icon={TrendingUp}
              subtitle="No data available"
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
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted-foreground">
                        <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No campaigns found</p>
                        <p className="text-xs mt-2">Campaigns will appear here once they are created</p>
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}