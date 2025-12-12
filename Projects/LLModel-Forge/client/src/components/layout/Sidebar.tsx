import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell, ConnectionStatus } from "@/components/notifications";
import {
  LayoutDashboard,
  Database,
  TestTube2,
  Tag,
  Calculator,
  Settings,
  Activity,
  Box,
  Workflow,
  LogOut,
  Bell,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  GitBranch,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Model Registry", href: "/model-registry", icon: Box },
  { name: "Pipelines", href: "/pipelines", icon: Workflow },
  { name: "Feature Store", href: "/feature-store", icon: Database },
  { name: "Experiments", href: "/experiments", icon: TestTube2 },
];

const toolsNavigation = [
  { name: "Data Labeling", href: "/labeling", icon: Tag },
  { name: "Score Simulator", href: "/simulator", icon: Calculator },
  { name: "A/B Testing", href: "/ab-testing", icon: GitBranch },
  { name: "Auto-Retrain", href: "/auto-retrain", icon: RefreshCw },
  { name: "Explainability", href: "/explainability", icon: Sparkles },
];

const systemNavigation = [
  { name: "Monitoring", href: "/monitoring", icon: BarChart3 },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const NavSection = ({ title, items }: { title: string; items: typeof mainNavigation }) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = location === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all cursor-pointer",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                !isCollapsed && "mr-3"
              )}
            />
            {!isCollapsed && item.name}
          </Link>
        );
      })}
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className={cn(
        "flex h-16 items-center border-b border-border px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight">LLM-Forge</span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-muted rounded hidden lg:block"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        <nav className="px-3 space-y-6">
          <NavSection title="Main" items={mainNavigation} />
          <NavSection title="Tools" items={toolsNavigation} />
          <NavSection title="System" items={systemNavigation} />
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-2">
        {!isCollapsed && <ConnectionStatus />}

        <div className={cn(
          "flex items-center gap-3 rounded-md bg-sidebar-accent/50 p-3",
          isCollapsed && "justify-center p-2"
        )}>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-xs font-bold shrink-0">
            {user?.name ? getInitials(user.name) : "U"}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{user?.name || "User"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.role || "ML Engineer"}</span>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && "Sign Out"}
        </button>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full flex items-center justify-center p-2 hover:bg-muted rounded"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border border-border rounded-md shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-1 hover:bg-muted rounded"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-screen flex-col">
          <SidebarContent />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </div>
    </>
  );
}

