import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Bell,
  Shield,
  Palette,
  Key,
  Globe,
  Database,
  Server,
  Mail,
  Slack,
  Github,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSection {
  id: string;
  name: string;
  icon: any;
  description: string;
}

const sections: SettingsSection[] = [
  { id: "profile", name: "Profile", icon: User, description: "Manage your account information" },
  { id: "notifications", name: "Notifications", icon: Bell, description: "Configure alert preferences" },
  { id: "security", name: "Security", icon: Shield, description: "Password and authentication" },
  { id: "appearance", name: "Appearance", icon: Palette, description: "Theme and display settings" },
  { id: "integrations", name: "Integrations", icon: Key, description: "Connect external services" },
  { id: "api", name: "API Keys", icon: Server, description: "Manage API access tokens" },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [settings, setSettings] = useState({
    // Profile
    name: "Jane Smith",
    email: "jane.smith@company.com",
    role: "ML Engineer",
    team: "Data Science",

    // Notifications
    emailNotifications: true,
    slackNotifications: true,
    pipelineAlerts: true,
    modelDriftAlerts: true,
    weeklyDigest: false,

    // Appearance
    darkMode: true,
    compactView: false,
    showMetrics: true,

    // Integrations
    githubConnected: true,
    slackConnected: true,
    awsConnected: false,
    gcpConnected: false,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                JS
              </div>
              <div>
                <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => updateSetting("name", e.target.value)}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateSetting("email", e.target.value)}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={settings.role}
                  onChange={(e) => updateSetting("role", e.target.value)}
                  className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team</Label>
                <Input
                  id="team"
                  value={settings.team}
                  onChange={(e) => updateSetting("team", e.target.value)}
                  className="bg-card border-border"
                />
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(v) => updateSetting("emailNotifications", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div className="flex items-center gap-3">
                    <Slack className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Slack Notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified in Slack</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.slackNotifications}
                    onCheckedChange={(v) => updateSetting("slackNotifications", v)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Alert Types
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div>
                    <p className="font-medium">Pipeline Status Changes</p>
                    <p className="text-sm text-muted-foreground">When pipelines complete or fail</p>
                  </div>
                  <Switch
                    checked={settings.pipelineAlerts}
                    onCheckedChange={(v) => updateSetting("pipelineAlerts", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div>
                    <p className="font-medium">Model Drift Alerts</p>
                    <p className="text-sm text-muted-foreground">When data drift is detected</p>
                  </div>
                  <Switch
                    checked={settings.modelDriftAlerts}
                    onCheckedChange={(v) => updateSetting("modelDriftAlerts", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Summary of platform activity</p>
                  </div>
                  <Switch
                    checked={settings.weeklyDigest}
                    onCheckedChange={(v) => updateSetting("weeklyDigest", v)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Use dark theme throughout</p>
                  </div>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(v) => updateSetting("darkMode", v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                <div>
                  <p className="font-medium">Compact View</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(v) => updateSetting("compactView", v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                <div>
                  <p className="font-medium">Show Metrics in Cards</p>
                  <p className="text-sm text-muted-foreground">Display inline performance metrics</p>
                </div>
                <Switch
                  checked={settings.showMetrics}
                  onCheckedChange={(v) => updateSetting("showMetrics", v)}
                />
              </div>
            </div>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className={cn(
                "border-border bg-card/50 transition-colors",
                settings.githubConnected && "border-green-500/30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Github className="h-8 w-8" />
                      <div>
                        <p className="font-medium">GitHub</p>
                        <p className="text-sm text-muted-foreground">Version control</p>
                      </div>
                    </div>
                    <button className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      settings.githubConnected
                        ? "bg-green-500/10 text-green-500 border border-green-500/30"
                        : "bg-primary text-primary-foreground"
                    )}>
                      {settings.githubConnected ? "Connected" : "Connect"}
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className={cn(
                "border-border bg-card/50 transition-colors",
                settings.slackConnected && "border-green-500/30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Slack className="h-8 w-8" />
                      <div>
                        <p className="font-medium">Slack</p>
                        <p className="text-sm text-muted-foreground">Notifications</p>
                      </div>
                    </div>
                    <button className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      settings.slackConnected
                        ? "bg-green-500/10 text-green-500 border border-green-500/30"
                        : "bg-primary text-primary-foreground"
                    )}>
                      {settings.slackConnected ? "Connected" : "Connect"}
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="font-medium">AWS</p>
                        <p className="text-sm text-muted-foreground">Cloud infrastructure</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary/90">
                      Connect
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">Google Cloud</p>
                        <p className="text-sm text-muted-foreground">Cloud infrastructure</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground transition-colors hover:bg-primary/90">
                      Connect
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Production API Key</p>
                  <p className="text-sm text-muted-foreground">Use this key for production workloads</p>
                </div>
                <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Regenerate
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value="llmf_prod_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  readOnly
                  className="font-mono text-sm bg-muted border-border"
                />
                <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">
                  Copy
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Development API Key</p>
                  <p className="text-sm text-muted-foreground">For testing and development only</p>
                </div>
                <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Regenerate
                </button>
              </div>
              <div className="flex gap-2">
                <Input
                  value="llmf_dev_yyyyyyyyyyyyyyyyyyyyyyyyyy"
                  readOnly
                  className="font-mono text-sm bg-muted border-border"
                />
                <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">
                  Copy
                </button>
              </div>
            </div>

            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-500">
                  <strong>Security Notice:</strong> Never share your API keys publicly.
                  If you believe a key has been compromised, regenerate it immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-card border-border"
                  />
                </div>
                <div></div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-card border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-card border-border"
                  />
                </div>
              </div>
              <button className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Update Password
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Two-Factor Authentication
              </h3>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Setup
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Sessions
              </h3>
              <div className="p-4 rounded-lg border border-border bg-card/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">Windows • Chrome • Active now</p>
                  </div>
                  <span className="text-xs text-green-500">Current</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and platform preferences.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                activeSection === section.id
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <section.icon className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">{section.name}</p>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <Card className="lg:col-span-3 border-border bg-card">
          <CardHeader>
            <CardTitle>
              {sections.find(s => s.id === activeSection)?.name}
            </CardTitle>
            <CardDescription>
              {sections.find(s => s.id === activeSection)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderSection()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

