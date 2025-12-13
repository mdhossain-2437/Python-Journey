/**
 * Settings Page
 *
 * User preferences, system settings, notifications, and diagnostics
 */

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSystem } from "@/lib/system-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Bell, Shield, Palette, Activity, Database,
  RefreshCw, Check, X, AlertTriangle, Loader2,
  Moon, Sun, Monitor, Zap, Wifi, WifiOff
} from "lucide-react";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const {
    settings,
    updateSettings,
    resetSettings,
    health,
    checkHealth,
    runDiagnostics,
    autoFixAll,
    notifications,
    unreadCount,
    markAllAsRead,
    clearAllNotifications,
    isOnline,
    lastSync,
  } = useSystem();

  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);

  const handleHealthCheck = async () => {
    setIsCheckingHealth(true);
    await checkHealth();
    setIsCheckingHealth(false);
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const results = await runDiagnostics();
    setDiagnosticResults(results);
    setIsRunningDiagnostics(false);
  };

  const handleAutoFixAll = async () => {
    setIsAutoFixing(true);
    await autoFixAll();
    setIsAutoFixing(false);
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 relative">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    defaultValue={user?.name}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  defaultValue={user?.username}
                  placeholder="username"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed
                </p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
                Save Changes
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive in-app notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ notifications: { ...settings.notifications, enabled: checked } })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Desktop Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Show browser notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.desktop}
                  onCheckedChange={(checked) =>
                    updateSettings({ notifications: { ...settings.notifications, desktop: checked } })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sound</p>
                  <p className="text-sm text-muted-foreground">
                    Play sound for notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.sound}
                  onCheckedChange={(checked) =>
                    updateSettings({ notifications: { ...settings.notifications, sound: checked } })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all as read
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No notifications
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg border ${
                        notif.read ? "bg-muted/30" : "bg-primary/5 border-primary/20"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {notif.type === "error" && <X className="h-4 w-4 text-destructive mt-0.5" />}
                        {notif.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                        {notif.type === "success" && <Check className="h-4 w-4 text-green-500 mt-0.5" />}
                        {notif.type === "info" && <Bell className="h-4 w-4 text-blue-500 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Choose your preferred color scheme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => updateSettings({ theme: "light" })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    settings.theme === "light" ? "border-primary" : "border-border"
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Light</p>
                </button>
                <button
                  onClick={() => updateSettings({ theme: "dark" })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    settings.theme === "dark" ? "border-primary" : "border-border"
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Dark</p>
                </button>
                <button
                  onClick={() => updateSettings({ theme: "system" })}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    settings.theme === "system" ? "border-primary" : "border-border"
                  }`}
                >
                  <Monitor className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">System</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing for more content
                  </p>
                </div>
                <Switch
                  checked={settings.display.compactMode}
                  onCheckedChange={(checked) =>
                    updateSettings({ display: { ...settings.display, compactMode: checked } })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Animations</p>
                  <p className="text-sm text-muted-foreground">
                    Enable UI animations
                  </p>
                </div>
                <Switch
                  checked={settings.display.animationsEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ display: { ...settings.display, animationsEnabled: checked } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                System Health
                <Badge variant={
                  health.status === "healthy" ? "default" :
                  health.status === "degraded" ? "secondary" : "destructive"
                }>
                  {health.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                Monitor system status and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold">{health.cpu.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">CPU</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold">{health.memory.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Memory</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold">{health.apiLatency}ms</p>
                  <p className="text-xs text-muted-foreground">Latency</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    {isOnline ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleHealthCheck}
                  disabled={isCheckingHealth}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isCheckingHealth ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </button>
                <button
                  onClick={handleRunDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50"
                >
                  {isRunningDiagnostics ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}
                  Run Diagnostics
                </button>
              </div>

              {health.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Issues ({health.issues.length})</p>
                    <button
                      onClick={handleAutoFixAll}
                      disabled={isAutoFixing}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {isAutoFixing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      Auto-fix all
                    </button>
                  </div>
                  {health.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-3 rounded-lg border ${
                        issue.resolved ? "bg-green-500/10 border-green-500/20" :
                        issue.severity === "critical" ? "bg-red-500/10 border-red-500/20" :
                        "bg-yellow-500/10 border-yellow-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{issue.component}</p>
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                        </div>
                        <Badge variant={
                          issue.resolved ? "default" :
                          issue.severity === "critical" ? "destructive" : "secondary"
                        }>
                          {issue.resolved ? "Fixed" : issue.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {lastSync && (
                <p className="text-xs text-muted-foreground text-center">
                  Last checked: {lastSync.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Fix Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Issue Resolution</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically attempt to fix detected issues
                  </p>
                </div>
                <Switch
                  checked={settings.autoFix.enabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ autoFix: { ...settings.autoFix, enabled: checked } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Help improve the app with anonymous usage data
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.analyticsEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ privacy: { ...settings.privacy, analyticsEnabled: checked } })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Crash Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Send crash reports to help fix bugs
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.crashReportsEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ privacy: { ...settings.privacy, crashReportsEnabled: checked } })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your linked OAuth accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <button className="text-sm text-primary hover:underline">
                  Connect
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Google</p>
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  </div>
                </div>
                <button className="text-sm text-primary hover:underline">
                  Connect
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <button
                onClick={resetSettings}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted"
              >
                Reset All Settings
              </button>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">
                Delete Account
              </button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

