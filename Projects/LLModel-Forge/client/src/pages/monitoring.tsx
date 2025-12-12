import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats, useModels, usePipelines, useExperiments } from "@/hooks/use-api";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Activity,
  Server,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";

// Simulated time-series data (in real app, would come from metrics API)
const generateTimeSeriesData = () => {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requests: Math.floor(Math.random() * 5000) + 1000,
      latency: Math.floor(Math.random() * 50) + 20,
      errors: Math.floor(Math.random() * 10),
      predictions: Math.floor(Math.random() * 2000) + 500,
    });
  }
  return data;
};

const timeSeriesData = generateTimeSeriesData();

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function Monitoring() {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardStats();
  const { data: models = [] } = useModels();
  const { data: pipelines = [] } = usePipelines();
  const { data: experiments = [] } = useExperiments();
  const { isConnected } = useWebSocket();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Calculate metrics
  const modelsByStage = [
    { name: 'Production', value: models.filter(m => m.stage === 'production').length },
    { name: 'Staging', value: models.filter(m => m.stage === 'staging').length },
    { name: 'Development', value: models.filter(m => m.stage === 'development').length },
    { name: 'Archived', value: models.filter(m => m.stage === 'archived').length },
  ].filter(s => s.value > 0);

  const experimentsByStatus = [
    { name: 'Running', value: experiments.filter(e => e.status === 'running').length, color: '#6366f1' },
    { name: 'Completed', value: experiments.filter(e => e.status === 'completed').length, color: '#10b981' },
    { name: 'Failed', value: experiments.filter(e => e.status === 'failed').length, color: '#ef4444' },
  ].filter(s => s.value > 0);

  // System health metrics (simulated)
  const systemHealth = {
    cpu: Math.floor(Math.random() * 30) + 20,
    memory: Math.floor(Math.random() * 20) + 40,
    disk: Math.floor(Math.random() * 15) + 25,
    network: Math.floor(Math.random() * 10) + 5,
  };

  if (statsLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Real-time metrics, performance, and system health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            isConnected
              ? "bg-green-500/10 text-green-500 border border-green-500/30"
              : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
          )}>
            <Wifi className="h-4 w-4" />
            {isConnected ? "Live" : "Connecting..."}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Active Models",
            value: stats?.activeModels || 0,
            change: "+12%",
            trend: "up",
            icon: Server,
            color: "text-primary"
          },
          {
            label: "Total Predictions",
            value: stats?.totalPredictions || 0,
            change: "+28%",
            trend: "up",
            icon: Zap,
            color: "text-green-500"
          },
          {
            label: "Avg Latency",
            value: `${stats?.avgLatency || 0}ms`,
            change: "-5%",
            trend: "down",
            icon: Clock,
            color: "text-blue-500"
          },
          {
            label: "Running Pipelines",
            value: stats?.runningPipelines || 0,
            change: "Active",
            trend: "neutral",
            icon: Activity,
            color: "text-yellow-500"
          },
        ].map((metric) => (
          <Card key={metric.label} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className={cn("text-2xl font-bold font-mono mt-1", metric.color)}>
                    {metric.value}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {metric.trend === "down" && <TrendingDown className="h-3 w-3 text-green-500" />}
                    <span className="text-xs text-muted-foreground">{metric.change}</span>
                  </div>
                </div>
                <metric.icon className={cn("h-8 w-8 opacity-50", metric.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requests Over Time */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-semibold">API Requests (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#6366f1" fillOpacity={1} fill="url(#colorReqs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Latency Over Time */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-semibold">Response Latency (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Models by Stage */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-semibold">Models by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelsByStage}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {modelsByStage.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {modelsByStage.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Experiments Status */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-semibold">Experiments Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experimentsByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {experimentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-semibold">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "CPU Usage", value: systemHealth.cpu, icon: Cpu, color: systemHealth.cpu > 80 ? "text-red-500" : "text-green-500" },
              { label: "Memory", value: systemHealth.memory, icon: MemoryStick, color: systemHealth.memory > 80 ? "text-red-500" : "text-green-500" },
              { label: "Disk Usage", value: systemHealth.disk, icon: HardDrive, color: systemHealth.disk > 80 ? "text-red-500" : "text-green-500" },
              { label: "Network I/O", value: systemHealth.network, icon: Wifi, color: "text-green-500" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className={cn("text-sm font-mono font-medium", item.color)}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.value > 80 ? "bg-red-500" : item.value > 60 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Status */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-semibold">Recent Pipeline Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pipelines.slice(0, 5).map((pipeline) => (
              <div key={pipeline.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-3 w-3 rounded-full",
                    pipeline.status === "running" && "bg-blue-500 animate-pulse",
                    pipeline.status === "completed" && "bg-green-500",
                    pipeline.status === "failed" && "bg-red-500",
                    pipeline.status === "idle" && "bg-gray-500"
                  )} />
                  <div>
                    <p className="font-medium">{pipeline.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pipeline.lastRunAt
                        ? `Last run: ${new Date(pipeline.lastRunAt).toLocaleString()}`
                        : "Never run"}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full capitalize",
                  pipeline.status === "running" && "bg-blue-500/10 text-blue-500",
                  pipeline.status === "completed" && "bg-green-500/10 text-green-500",
                  pipeline.status === "failed" && "bg-red-500/10 text-red-500",
                  pipeline.status === "idle" && "bg-gray-500/10 text-gray-500"
                )}>
                  {pipeline.status}
                </span>
              </div>
            ))}
            {pipelines.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">No pipelines configured</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

