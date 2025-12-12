import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, Server, Users, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import generatedImage from '@assets/generated_images/dark_abstract_neural_network_background.png';

const data = [
  { time: "00:00", requests: 4000, latency: 240 },
  { time: "04:00", requests: 3000, latency: 139 },
  { time: "08:00", requests: 2000, latency: 980 },
  { time: "12:00", requests: 2780, latency: 390 },
  { time: "16:00", requests: 1890, latency: 480 },
  { time: "20:00", requests: 2390, latency: 380 },
  { time: "24:00", requests: 3490, latency: 430 },
];

const stats = [
  {
    title: "Active Models",
    value: "12",
    change: "+2.5%",
    icon: Server,
    trend: "up",
  },
  {
    title: "Total Predictions",
    value: "1.2M",
    change: "+14%",
    icon: Zap,
    trend: "up",
  },
  {
    title: "Avg Latency",
    value: "45ms",
    change: "-1.2%",
    icon: Activity,
    trend: "down", // Good for latency
  },
  {
    title: "Data Drift",
    value: "0.03",
    change: "+0.01",
    icon: AlertTriangle,
    trend: "up", // Bad
    alert: true,
  },
];

export default function Dashboard() {
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
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back, Engineer</h2>
          <p className="text-muted-foreground max-w-xl mb-6">
            Your production models are performing within expected parameters. 
            There are 3 simulations pending review and 1 data drift alert requiring attention.
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
        {stats.map((stat) => (
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
                stat.alert ? "text-destructive" : "text-primary"
              } mt-1`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Inference Volume & Latency</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis 
                    dataKey="time" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--popover-foreground))"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRequests)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="latency" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorLatency)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle>Recent Deployment Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                { model: "Fraud_Detection_v2", action: "Deployed to Prod", time: "2h ago", status: "success" },
                { model: "RecSys_Core_v5", action: "Training Completed", time: "5h ago", status: "success" },
                { model: "Churn_Predictor_v1", action: "Validation Failed", time: "8h ago", status: "failed" },
                { model: "NLP_Sentiment_v3", action: "Drift Detected", time: "1d ago", status: "warning" },
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className={`mr-4 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background`}>
                    {item.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {item.status === 'failed' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                    {item.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{item.model}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.action} • {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
