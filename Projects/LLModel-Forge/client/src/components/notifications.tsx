import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAlerts, useMarkAlertRead } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  X,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff
} from "lucide-react";
import { cn } from "@/lib/utils";

function getAlertTitle(severity: string): string {
  switch (severity) {
    case "error": return "Error";
    case "warning": return "Warning";
    case "info": return "Info";
    default: return "Notification";
  }
}

function getAlertIcon(severity: string) {
  switch (severity) {
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "info":
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
}

function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch {
    return "";
  }
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: alerts = [], isLoading, refetch } = useAlerts();
  const markRead = useMarkAlertRead();
  const { toast } = useToast();
  const { isConnected, subscribeToType } = useWebSocket({ enabled: true });

  // Listen for real-time alerts
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToType("alert", (data) => {
      toast({
        title: getAlertTitle(data.severity),
        description: data.message,
        variant: data.severity === "error" ? "destructive" : "default",
      });
      refetch();
    });

    return unsubscribe;
  }, [isConnected, subscribeToType, toast, refetch]);

  const unreadCount = alerts.filter((a: any) => !a.isRead).length;

  const handleMarkRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
    } catch {
      // Silent fail
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((a: any) => !a.isRead);
    for (const alert of unread) {
      try {
        await markRead.mutateAsync(alert.id);
      } catch {
        // Continue with next
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-lg border border-border bg-card shadow-lg z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold">Notifications</h3>
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
            <div className="max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.slice(0, 20).map((alert: any) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                        !alert.isRead && "bg-primary/5"
                      )}
                      onClick={() => !alert.isRead && handleMarkRead(alert.id)}
                    >
                      <div className="shrink-0 mt-0.5">
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
                        <div className="shrink-0">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ConnectionStatus() {
  const { isConnected, connectionError } = useWebSocket({ enabled: true });

  return (
    <div className="flex items-center gap-2 text-xs">
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-green-500">Connected</span>
        </>
      ) : connectionError ? (
        <>
          <WifiOff className="h-3 w-3 text-red-500" />
          <span className="text-red-500">Disconnected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Offline</span>
        </>
      )}
    </div>
  );
}

export default NotificationBell;

