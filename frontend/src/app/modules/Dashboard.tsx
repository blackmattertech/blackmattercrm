import { useState } from "react";
import { MetricCard } from "../components/MetricCard";
import { ChartCard } from "../components/ChartCard";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  Calendar,
  Target,
  Activity
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR, formatINRCompact, formatDate } from "../utils/formatters";

export function Dashboard() {
  const [activityFilter, setActivityFilter] = useState<"all" | "sales" | "accounts" | "team">("all");

  // Chart data
  const revenueData = [
    { month: "Jan", revenue: 45000, expenses: 12000 },
    { month: "Feb", revenue: 52000, expenses: 15000 },
    { month: "Mar", revenue: 48000, expenses: 13000 },
    { month: "Apr", revenue: 61000, expenses: 14000 },
    { month: "May", revenue: 55000, expenses: 16000 },
    { month: "Jun", revenue: 72000, expenses: 18000 },
  ];

  const pipelineData = [
    { stage: "New", count: 12 },
    { stage: "Contacted", count: 8 },
    { stage: "Qualified", count: 15 },
    { stage: "Proposal", count: 6 },
    { stage: "Won", count: 4 },
  ];

  // Empty arrays - will be populated from API when backend endpoints are implemented
  const activities: any[] = [];
  const projects: any[] = [];
  const upcomingTasks: any[] = [];

  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 border-b bg-background">
        <div className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-medium mb-1">Your Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Track your business performance and insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-xl">
                <Calendar className="w-4 h-4 mr-2" />
                Last 30 days
              </Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-xl">
                Export Log
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          {/* Metrics Grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <MetricCard
              title="Today Revenue"
              value="—"
              icon={DollarSign}
              subtitle="No data available"
              highlight={true}
            />
            <MetricCard
              title="Weekly Sales"
              value="—"
              icon={Activity}
              subtitle="No data available"
            />
            <MetricCard
              title="Monthly Target"
              value="—"
              icon={Target}
              subtitle="No data available"
            />
            <MetricCard
              title="Active Leads"
              value="—"
              icon={Users}
              subtitle="No data available"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sales Funnel Chart */}
            <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-medium text-lg mb-1">Sales Funnel</h3>
                  <p className="text-xs text-muted-foreground">Pipeline by stage</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg">
                    <span className="text-xs">Weekly</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg">
                    <span className="text-xs">Monthly</span>
                  </Button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="stage" 
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Order Heatmap */}
            <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-medium text-lg mb-1">Order</h3>
                  <p className="text-xs text-muted-foreground">Heat map of order leads</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg">
                    <span className="text-xs">Weekly</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg">
                    <span className="text-xs">Monthly</span>
                  </Button>
                </div>
              </div>
              
              {/* Heatmap Grid */}
              <div className="space-y-3">
                {['Facebook', 'Instagram', 'TikTok', 'WhatsApp'].map((platform, idx) => (
                  <div key={platform} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">{platform}</span>
                    <div className="flex-1 grid grid-cols-7 gap-1.5">
                      {Array.from({ length: 7 }, (_, i) => {
                        const intensity = Math.random();
                        return (
                          <div
                            key={i}
                            className="aspect-square rounded-md transition-all hover:scale-110"
                            style={{
                              backgroundColor: intensity > 0.7 
                                ? 'var(--accent)' 
                                : intensity > 0.4 
                                  ? 'var(--pale-lime)' 
                                  : 'var(--muted)'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="font-medium text-lg mb-1">Revenue Overview</h3>
                <p className="text-xs text-muted-foreground">Monthly revenue vs expenses</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-foreground" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Expenses</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--foreground)" 
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--foreground)', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="var(--muted-foreground)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'var(--muted-foreground)', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Projects & Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Active Projects */}
            <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-medium text-lg">Active Projects</h3>
                <Button variant="ghost" size="sm" className="text-xs h-8 rounded-lg">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No active projects</p>
                    <p className="text-xs mt-1">Projects will appear here</p>
                  </div>
                ) : (
                  projects.map((project) => (
                  <div key={project.id} className="p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{project.name}</h4>
                        <p className="text-xs text-muted-foreground">{project.client}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-medium text-lg">Recent Activity</h3>
                <div className="flex gap-1">
                  {(['all', 'sales', 'accounts', 'team'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={activityFilter === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActivityFilter(filter)}
                      className="h-7 px-3 text-xs rounded-lg capitalize"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Activity will appear here</p>
                  </div>
                ) : (
                  activities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className="flex gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-0.5">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-medium text-lg">Upcoming Tasks</h3>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl h-8">
                Add Task
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingTasks.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  <p className="text-sm">No upcoming tasks</p>
                  <p className="text-xs mt-1">Tasks will appear here</p>
                </div>
              ) : (
                upcomingTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-xl border border-border hover:border-muted-foreground/20 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-5 h-5 rounded border-2 border-muted-foreground/40 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium mb-1">{task.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{task.due}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' 
                        ? 'bg-destructive/10 text-destructive' 
                        : task.priority === 'medium' 
                          ? 'bg-warning/10 text-warning' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}