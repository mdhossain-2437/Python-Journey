import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAlerts, useMarkAlertRead, type Alert } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Loader2,
  Filter,
  Check,
  Trash2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Alerts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");

  const { data: alerts = [], isLoading, refetch } = useAlerts();
  const markRead = useMarkAlertRead();
  const { toast } = useToast();

  const filteredAlerts = alerts.filter((alert: Alert) => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = !severityFilter || alert.severity === severityFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unread" && !alert.isRead) ||
      (statusFilter === "read" && alert.isRead);
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark alert as read", variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.isRead);
    for (const alert of unread) {
      await markRead.mutateAsync(alert.id);
    }
    toast({ title: "Success", description: "All alerts marked as read" });
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "error": return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "success": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error": return "bg-red-500/10 text-red-500 border-red-500/30";
      case "warning": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "success": return "bg-green-500/10 text-green-500 border-green-500/30";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const severityCounts = {
    all: alerts.length,
    error: alerts.filter(a => a.severity === "error").length,
    warning: alerts.filter(a => a.severity === "warning").length,
    info: alerts.filter(a => a.severity === "info").length,
    success: alerts.filter(a => a.severity === "success").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Monitor system alerts, model drift warnings, and pipeline notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Alerts", value: severityCounts.all, icon: Bell },
          { label: "Errors", value: severityCounts.error, icon: AlertCircle, color: "text-red-500" },
          { label: "Warnings", value: severityCounts.warning, icon: AlertTriangle, color: "text-yellow-500" },
          { label: "Unread", value: unreadCount, icon: Info, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-2xl font-bold font-mono mt-1", stat.color)}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={cn("h-8 w-8 opacity-50", stat.color || "text-muted-foreground")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {["all", "unread", "read"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border capitalize",
                statusFilter === status
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {["error", "warning", "info"].map((severity) => (
            <button
              key={severity}
              onClick={() => setSeverityFilter(severityFilter === severity ? null : severity)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border capitalize",
                severityFilter === severity
                  ? getSeverityColor(severity)
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {severity}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No alerts found</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm || severityFilter || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAlerts.map((alert: Alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors",
                    !alert.isRead && "bg-primary/5"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={cn("text-sm", !alert.isRead && "font-medium")}>
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full border capitalize",
                            getSeverityColor(alert.severity)
                          )}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(alert.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkRead(alert.id)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {!alert.isRead && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

