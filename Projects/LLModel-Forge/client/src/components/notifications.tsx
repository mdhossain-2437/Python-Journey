import { useState, useEffect } from "react";
import { useWebSocket, useAlertNotifications } from "@/hooks/use-websocket";
import { useAlerts, useMarkAlertRead } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: alerts = [], isLoading, refetch } = useAlerts();
  const markRead = useMarkAlertRead();
  const { toast } = useToast();
  const { isConnected } = useWebSocket();

  // Listen for real-time alerts
  useAlertNotifications((alert) => {
    toast({
      title: getAlertTitle(alert.severity),
      description: alert.message,
      variant: alert.severity === "error" ? "destructive" : "default",
    });
    refetch();
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const handleMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
    } catch (error) {
      // Silent fail
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter(a => !a.isRead);
    for (const alert of unread) {
      await markRead.mutateAsync(alert.id);
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertTitle = (severity: string) => {
    switch (severity) {
      case "error": return "Error";
      case "warning": return "Warning";
      case "success": return "Success";
      default: return "Info";
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          isOpen ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border-2 border-background" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 max-h-[500px] overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.slice(0, 20).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                        !alert.isRead && "bg-primary/5"
                      )}
                      onClick={() => !alert.isRead && handleMarkRead(alert.id)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm",
                          !alert.isRead && "font-medium"
                        )}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(alert.createdAt)}
                        </p>
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
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="p-3 border-t border-border text-center">
                <a
                  href="/settings"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Notification Settings
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Connection status indicator
export function ConnectionStatus() {
  const { isConnected } = useWebSocket();

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium",
      isConnected
        ? "bg-green-500/10 text-green-500"
        : "bg-yellow-500/10 text-yellow-500"
    )}>
      <span className={cn(
        "h-2 w-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
      )} />
      {isConnected ? "Live" : "Connecting..."}
    </div>
  );
}

