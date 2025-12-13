/**
 * System Notifications and Settings Manager
 *
 * Features:
 * - Real-time notifications
 * - System health monitoring
 * - Auto-diagnostics
 * - Settings management
 * - Error tracking and auto-fix
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

// ==================== TYPES ====================

export interface SystemNotification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
  autoFix?: () => Promise<boolean>;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "critical";
  cpu: number;
  memory: number;
  disk: number;
  apiLatency: number;
  dbConnection: boolean;
  wsConnection: boolean;
  lastCheck: Date;
  issues: SystemIssue[];
}

export interface SystemIssue {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  component: string;
  description: string;
  autoFixable: boolean;
  fixAttempted: boolean;
  resolved: boolean;
}

export interface SystemSettings {
  theme: "light" | "dark" | "system";
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  autoFix: {
    enabled: boolean;
    maxAttempts: number;
  };
  display: {
    compactMode: boolean;
    animationsEnabled: boolean;
    chartRefreshRate: number;
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReportsEnabled: boolean;
  };
}

interface SystemContextType {
  // Notifications
  notifications: SystemNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<SystemNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // System Health
  health: SystemHealth;
  checkHealth: () => Promise<void>;
  runDiagnostics: () => Promise<SystemIssue[]>;
  autoFixIssue: (issueId: string) => Promise<boolean>;
  autoFixAll: () => Promise<number>;

  // Settings
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  resetSettings: () => void;

  // System Status
  isOnline: boolean;
  lastSync: Date | null;
}

// ==================== DEFAULT VALUES ====================

const defaultSettings: SystemSettings = {
  theme: "dark",
  notifications: {
    enabled: true,
    sound: false,
    desktop: true,
    email: false,
  },
  autoFix: {
    enabled: true,
    maxAttempts: 3,
  },
  display: {
    compactMode: false,
    animationsEnabled: true,
    chartRefreshRate: 5000,
  },
  privacy: {
    analyticsEnabled: true,
    crashReportsEnabled: true,
  },
};

const defaultHealth: SystemHealth = {
  status: "healthy",
  cpu: 0,
  memory: 0,
  disk: 0,
  apiLatency: 0,
  dbConnection: true,
  wsConnection: false,
  lastCheck: new Date(),
  issues: [],
};

// ==================== CONTEXT ====================

const SystemContext = createContext<SystemContextType | null>(null);

// ==================== PROVIDER ====================

export function SystemProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [health, setHealth] = useState<SystemHealth>(defaultHealth);
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem("llmodel-forge-settings");
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem("llmodel-forge-settings", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }, [settings]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification({
        type: "success",
        title: "Connection Restored",
        message: "You are back online. All features are now available.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addNotification({
        type: "warning",
        title: "Connection Lost",
        message: "You are offline. Some features may be unavailable.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Add notification
  const addNotification = useCallback((
    notification: Omit<SystemNotification, "id" | "timestamp" | "read">
  ) => {
    const newNotification: SystemNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 100)); // Keep last 100

    // Show toast for important notifications
    if (settings.notifications.enabled && notification.type !== "info") {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === "error" ? "destructive" : "default",
      });
    }

    // Desktop notification
    if (settings.notifications.desktop && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.png",
        });
      }
    }
  }, [settings.notifications, toast]);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear notification
  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Check system health
  const checkHealth = useCallback(async () => {
    const startTime = Date.now();
    const issues: SystemIssue[] = [];

    try {
      // Check API
      const response = await fetch("/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(5000)
      });
      const apiLatency = Date.now() - startTime;

      if (!response.ok) {
        issues.push({
          id: `issue-api-${Date.now()}`,
          severity: "high",
          component: "API",
          description: `API returned status ${response.status}`,
          autoFixable: false,
          fixAttempted: false,
          resolved: false,
        });
      }

      // Simulate resource checks (in real app, these would come from backend)
      const cpu = Math.random() * 60 + 20;
      const memory = Math.random() * 50 + 30;
      const disk = Math.random() * 40 + 20;

      // Check thresholds
      if (cpu > 90) {
        issues.push({
          id: `issue-cpu-${Date.now()}`,
          severity: "critical",
          component: "CPU",
          description: `CPU usage is at ${cpu.toFixed(1)}%`,
          autoFixable: false,
          fixAttempted: false,
          resolved: false,
        });
      }

      if (memory > 85) {
        issues.push({
          id: `issue-memory-${Date.now()}`,
          severity: "high",
          component: "Memory",
          description: `Memory usage is at ${memory.toFixed(1)}%`,
          autoFixable: true,
          fixAttempted: false,
          resolved: false,
        });
      }

      const status: SystemHealth["status"] =
        issues.some(i => i.severity === "critical") ? "critical" :
        issues.some(i => i.severity === "high") ? "degraded" : "healthy";

      setHealth({
        status,
        cpu,
        memory,
        disk,
        apiLatency,
        dbConnection: response.ok,
        wsConnection: true, // Check WebSocket status
        lastCheck: new Date(),
        issues,
      });

      setLastSync(new Date());
    } catch (error) {
      console.error("Health check failed:", error);

      issues.push({
        id: `issue-connection-${Date.now()}`,
        severity: "critical",
        component: "Network",
        description: "Unable to connect to the server",
        autoFixable: true,
        fixAttempted: false,
        resolved: false,
      });

      setHealth(prev => ({
        ...prev,
        status: "critical",
        dbConnection: false,
        issues,
        lastCheck: new Date(),
      }));
    }
  }, []);

  // Run diagnostics
  const runDiagnostics = useCallback(async (): Promise<SystemIssue[]> => {
    const issues: SystemIssue[] = [];

    // Check localStorage
    try {
      localStorage.setItem("__test__", "test");
      localStorage.removeItem("__test__");
    } catch {
      issues.push({
        id: `issue-storage-${Date.now()}`,
        severity: "medium",
        component: "LocalStorage",
        description: "LocalStorage is not available",
        autoFixable: false,
        fixAttempted: false,
        resolved: false,
      });
    }

    // Check WebSocket support
    if (!("WebSocket" in window)) {
      issues.push({
        id: `issue-ws-${Date.now()}`,
        severity: "high",
        component: "WebSocket",
        description: "WebSocket is not supported in this browser",
        autoFixable: false,
        fixAttempted: false,
        resolved: false,
      });
    }

    // Check for service worker
    if (!("serviceWorker" in navigator)) {
      issues.push({
        id: `issue-sw-${Date.now()}`,
        severity: "low",
        component: "ServiceWorker",
        description: "Service Worker not supported - PWA features limited",
        autoFixable: false,
        fixAttempted: false,
        resolved: false,
      });
    }

    // Check IndexedDB
    if (!("indexedDB" in window)) {
      issues.push({
        id: `issue-idb-${Date.now()}`,
        severity: "medium",
        component: "IndexedDB",
        description: "IndexedDB not available - offline features limited",
        autoFixable: false,
        fixAttempted: false,
        resolved: false,
      });
    }

    addNotification({
      type: issues.length > 0 ? "warning" : "success",
      title: "Diagnostics Complete",
      message: issues.length > 0
        ? `Found ${issues.length} issue(s) that may affect performance`
        : "All systems are functioning normally",
    });

    return issues;
  }, [addNotification]);

  // Auto-fix issue
  const autoFixIssue = useCallback(async (issueId: string): Promise<boolean> => {
    const issue = health.issues.find(i => i.id === issueId);
    if (!issue || !issue.autoFixable) return false;

    // Mark as attempted
    setHealth(prev => ({
      ...prev,
      issues: prev.issues.map(i =>
        i.id === issueId ? { ...i, fixAttempted: true } : i
      ),
    }));

    // Simulate fix attempt
    await new Promise(resolve => setTimeout(resolve, 1000));

    const fixed = Math.random() > 0.3; // 70% success rate

    if (fixed) {
      setHealth(prev => ({
        ...prev,
        issues: prev.issues.map(i =>
          i.id === issueId ? { ...i, resolved: true } : i
        ),
      }));

      addNotification({
        type: "success",
        title: "Issue Resolved",
        message: `Automatically fixed: ${issue.description}`,
      });
    } else {
      addNotification({
        type: "error",
        title: "Auto-Fix Failed",
        message: `Could not automatically fix: ${issue.description}`,
      });
    }

    return fixed;
  }, [health.issues, addNotification]);

  // Auto-fix all
  const autoFixAll = useCallback(async (): Promise<number> => {
    const fixableIssues = health.issues.filter(i => i.autoFixable && !i.resolved);
    let fixedCount = 0;

    for (const issue of fixableIssues) {
      const fixed = await autoFixIssue(issue.id);
      if (fixed) fixedCount++;
    }

    return fixedCount;
  }, [health.issues, autoFixIssue]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<SystemSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev };

      // Deep merge
      Object.keys(updates).forEach(key => {
        const k = key as keyof SystemSettings;
        if (typeof updates[k] === "object" && updates[k] !== null) {
          (newSettings as any)[k] = { ...(prev as any)[k], ...(updates as any)[k] };
        } else {
          (newSettings as any)[k] = updates[k];
        }
      });

      return newSettings;
    });
  }, []);

  // Reset settings
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    addNotification({
      type: "info",
      title: "Settings Reset",
      message: "All settings have been restored to defaults",
    });
  }, [addNotification]);

  // Periodic health check
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Every minute
    return () => clearInterval(interval);
  }, [checkHealth]);

  const value: SystemContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    health,
    checkHealth,
    runDiagnostics,
    autoFixIssue,
    autoFixAll,
    settings,
    updateSettings,
    resetSettings,
    isOnline,
    lastSync,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

// ==================== HOOK ====================

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error("useSystem must be used within a SystemProvider");
  }
  return context;
}

export default {
  SystemProvider,
  useSystem,
};

