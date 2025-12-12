import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Database, 
  TestTube2, 
  Tag, 
  Calculator, 
  Settings,
  Activity,
  Box,
  Workflow
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Model Registry", href: "/model-registry", icon: Box },
  { name: "Pipelines", href: "/pipelines", icon: Workflow },
  { name: "Feature Store", href: "/feature-store", icon: Database },
  { name: "Experiments", href: "/experiments", icon: TestTube2 },
  { name: "Data Labeling", href: "/labeling", icon: Tag },
  { name: "Score Simulator", href: "/simulator", icon: Calculator },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Activity className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">LLModel-Forge</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}>
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/50 p-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-mono text-xs font-bold">
            JS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Jane Smith</span>
            <span className="text-xs text-muted-foreground">ML Engineer</span>
          </div>
          <Settings className="ml-auto h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </div>
    </div>
  );
}
