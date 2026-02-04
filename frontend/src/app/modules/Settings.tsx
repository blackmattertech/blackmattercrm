import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

export function Settings() {
  return (
    <div className="min-h-screen bg-soft-white dark:bg-background">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="w-full space-y-6 lg:space-y-8">
          <Tabs defaultValue="company" className="w-full max-w-4xl mx-auto">
            <TabsList className="rounded-xl">
              <TabsTrigger value="company" className="rounded-lg">Company</TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg">Users & Roles</TabsTrigger>
              <TabsTrigger value="integrations" className="rounded-lg">Integrations</TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-lg">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-6">Company Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="Acme Corporation" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="info@company.com" className="rounded-xl" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="+1 234 567 8900" className="rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Business St, City, Country" className="rounded-xl" />
                  </div>
                  <Button className="rounded-xl">Save Changes</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-lg">Team Members</h3>
                  <Button size="sm" className="rounded-xl">Invite User</Button>
                </div>
                <div className="space-y-3">
                  {["John Doe - Director", "Sarah Johnson - Manager", "Mike Chen - Staff"].map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{user.split(" - ")[0]}</p>
                        <p className="text-xs text-muted-foreground">{user.split(" - ")[1]}</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl">Edit</Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-6">API Integrations</h3>
                <div className="space-y-3">
                  {[
                    { name: "Stripe", status: true },
                    { name: "Google Workspace", status: true },
                    { name: "Slack", status: false },
                    { name: "Mailchimp", status: false }
                  ].map((integration, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {integration.status ? "Connected" : "Not connected"}
                        </p>
                      </div>
                      <Switch checked={integration.status} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
              <div className="bg-card border border-border rounded-2xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-lg mb-6">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    "Email notifications for new leads",
                    "Payment reminders",
                    "Weekly summary reports",
                    "Team activity updates"
                  ].map((pref, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <p className="text-sm">{pref}</p>
                      <Switch defaultChecked={idx < 2} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}