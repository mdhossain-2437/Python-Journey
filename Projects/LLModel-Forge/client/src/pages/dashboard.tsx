import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, Server, Zap, AlertTriangle, Loader2, Bell } from "lucide-react";
import { useDashboardStats, useAlerts, useMarkAlertRead } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import generatedImage from '@assets/generated_images/dark_abstract_neural_network_background.png';

const chartData = [
  { time: "00:00", requests: 4000, latency: 240 },
  { time: "04:00", requests: 3000, latency: 139 },
  { time: "08:00", requests: 2000, latency: 980 },
  { time: "12:00", requests: 2780, latency: 390 },
  { time: "16:00", requests: 1890, latency: 480 },
  { time: "20:00", requests: 2390, latency: 380 },
  { time: "24:00", requests: 3490, latency: 430 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: alerts = [] } = useAlerts();
  const markRead = useMarkAlertRead();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadCount = stats?.unreadAlerts ?? 0;

  const dashboardStats = [
    {
      title: "Active Models",
      value: stats?.activeModels || 0,
      change: "+2.5%",
      icon: Server,
      trend: "up",
    },
    {
      title: "Total Predictions",
      value: stats?.totalPredictions || 0,
      change: "+14%",
      icon: Zap,
      trend: "up",
    },
    {
      title: "Avg Latency",
      value: `${stats?.avgLatency || 0}ms`,
      change: "-1.2%",
      icon: Activity,
      trend: "down",
    },
    {
      title: "Unread Alerts",
      value: unreadCount,
      change: unreadCount > 0 ? "Needs attention" : "All clear",
      icon: AlertTriangle,
      trend: unreadCount > 0 ? "up" : "down",
      alert: unreadCount > 0,
    },
  ];

  const unreadAlerts = alerts.filter(a => !a.isRead).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground mt-2">Real-time metrics and system health status.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500 border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            System Operational
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute inset-0 z-0 opacity-40">
           <img src={generatedImage} alt="Background" className="h-full w-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        <div className="relative z-10 p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {user?.name || 'Engineer'}</h2>
          <p className="text-muted-foreground max-w-xl mb-6">
            Your production models are performing within expected parameters. 
            {unreadCount > 0
              ? ` You have ${unreadCount} unread alert(s) requiring attention.`
              : ' All systems operational.'}
          </p>
          <div className="flex gap-4">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors">
              View Alerts
            </button>
            <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors border border-border">
              Run Diagnostics
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.alert ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">{stat.value}</div>
              <p className={`text-xs ${
                stat.alert ? "text-destructive" : 
                stat.trend === "up" ? "text-green-500" : "text-green-500"
              }`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="font-semibold">Inference Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No unread alerts
              </p>
            ) : (
              unreadAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => markRead.mutate(alert.id)}
                >
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    alert.severity === 'warning' ? 'bg-yellow-500' : 
                    alert.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
