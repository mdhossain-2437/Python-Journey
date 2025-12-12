import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import {
  GitBranch,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelVariant {
  id: string;
  name: string;
  version: string;
  trafficPercentage: number;
  metrics: {
    accuracy: number;
    latency: number;
    throughput: number;
    errorRate: number;
  };
  status: "running" | "paused" | "completed";
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: "running" | "paused" | "completed" | "draft";
  startDate: string;
  endDate?: string;
  controlModel: ModelVariant;
  treatmentModel: ModelVariant;
  totalRequests: number;
  winner?: "control" | "treatment" | null;
}

// Sample A/B test data
const sampleTest: ABTest = {
  id: "ab_001",
  name: "Fraud Detection Model v3 vs v4",
  description: "Comparing new XGBoost model with improved feature engineering",
  status: "running",
  startDate: "2024-12-01",
  totalRequests: 125000,
  controlModel: {
    id: "model_001",
    name: "fraud-detection-xgboost",
    version: "3.2.1",
    trafficPercentage: 50,
    metrics: {
      accuracy: 0.934,
      latency: 45,
      throughput: 1200,
      errorRate: 0.002,
    },
    status: "running",
  },
  treatmentModel: {
    id: "model_002",
    name: "fraud-detection-xgboost-v4",
    version: "4.0.0",
    trafficPercentage: 50,
    metrics: {
      accuracy: 0.956,
      latency: 38,
      throughput: 1350,
      errorRate: 0.001,
    },
    status: "running",
  },
};

// Time series data for comparison
const timeSeriesData = Array.from({ length: 14 }, (_, i) => ({
  date: `Dec ${i + 1}`,
  control: 0.92 + Math.random() * 0.03,
  treatment: 0.94 + Math.random() * 0.03,
}));

export default function ABTesting() {
  const [test, setTest] = useState<ABTest>(sampleTest);
  const [loading, setLoading] = useState(false);
  const [trafficSplit, setTrafficSplit] = useState(50);

  const handleToggleTest = () => {
    setLoading(true);
    setTimeout(() => {
      setTest({
        ...test,
        status: test.status === "running" ? "paused" : "running",
      });
      setLoading(false);
    }, 500);
  };

  const handleDeclareWinner = (winner: "control" | "treatment") => {
    setTest({
      ...test,
      status: "completed",
      winner,
      endDate: new Date().toISOString(),
    });
  };

  const calculateSignificance = () => {
    const diff = test.treatmentModel.metrics.accuracy - test.controlModel.metrics.accuracy;
    const significance = Math.min(99, Math.abs(diff) * 1000 + 70);
    return significance;
  };

  const significance = calculateSignificance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            A/B Testing
          </h2>
          <p className="text-muted-foreground mt-1">
            Compare model versions in production with real traffic
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <GitBranch className="h-4 w-4" />
          New Test
        </button>
      </div>

      {/* Test Overview */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{test.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                test.status === "running" && "bg-green-500/10 text-green-500",
                test.status === "paused" && "bg-yellow-500/10 text-yellow-500",
                test.status === "completed" && "bg-blue-500/10 text-blue-500",
              )}>
                {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
              </span>
              <button
                onClick={handleToggleTest}
                disabled={loading || test.status === "completed"}
                className={cn(
                  "p-2 rounded-md transition-colors",
                  test.status === "running"
                    ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                    : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : test.status === "running" ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[
              { label: "Total Requests", value: test.totalRequests.toLocaleString(), icon: Zap },
              { label: "Duration", value: "13 days", icon: Clock },
              { label: "Statistical Significance", value: `${significance.toFixed(1)}%`, icon: BarChart3 },
              {
                label: "Status",
                value: significance >= 95 ? "Significant" : "Collecting data",
                icon: significance >= 95 ? CheckCircle2 : AlertTriangle,
                color: significance >= 95 ? "text-green-500" : "text-yellow-500"
              },
            ].map((stat) => (
              <div key={stat.label} className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <stat.icon className={cn("h-4 w-4", stat.color || "text-muted-foreground")} />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className={cn("text-xl font-bold font-mono mt-1", stat.color)}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Model Comparison */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Control */}
            <div className={cn(
              "p-4 rounded-lg border",
              test.winner === "control"
                ? "border-green-500 bg-green-500/5"
                : "border-border"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded">Control</span>
                  <h4 className="font-semibold mt-1">{test.controlModel.name}</h4>
                  <p className="text-xs text-muted-foreground">v{test.controlModel.version}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">{test.controlModel.trafficPercentage}%</p>
                  <p className="text-xs text-muted-foreground">Traffic</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="font-mono font-semibold">{(test.controlModel.metrics.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="font-mono font-semibold">{test.controlModel.metrics.latency}ms</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Throughput</p>
                  <p className="font-mono font-semibold">{test.controlModel.metrics.throughput}/s</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Error Rate</p>
                  <p className="font-mono font-semibold">{(test.controlModel.metrics.errorRate * 100).toFixed(2)}%</p>
                </div>
              </div>
              {test.status !== "completed" && (
                <button
                  onClick={() => handleDeclareWinner("control")}
                  className="w-full mt-4 py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-500/10 transition-colors text-sm font-medium"
                >
                  Declare Winner
                </button>
              )}
            </div>

            {/* Treatment */}
            <div className={cn(
              "p-4 rounded-lg border",
              test.winner === "treatment"
                ? "border-green-500 bg-green-500/5"
                : "border-border"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded">Treatment</span>
                  <h4 className="font-semibold mt-1">{test.treatmentModel.name}</h4>
                  <p className="text-xs text-muted-foreground">v{test.treatmentModel.version}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">{test.treatmentModel.trafficPercentage}%</p>
                  <p className="text-xs text-muted-foreground">Traffic</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="font-mono font-semibold text-green-500">{(test.treatmentModel.metrics.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="font-mono font-semibold text-green-500">{test.treatmentModel.metrics.latency}ms</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Throughput</p>
                  <p className="font-mono font-semibold text-green-500">{test.treatmentModel.metrics.throughput}/s</p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs text-muted-foreground">Error Rate</p>
                  <p className="font-mono font-semibold text-green-500">{(test.treatmentModel.metrics.errorRate * 100).toFixed(2)}%</p>
                </div>
              </div>
              {test.status !== "completed" && (
                <button
                  onClick={() => handleDeclareWinner("treatment")}
                  className="w-full mt-4 py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-500/10 transition-colors text-sm font-medium"
                >
                  Declare Winner
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy Over Time */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Accuracy Comparison Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0.9, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="control"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="Control (v3.2.1)"
                />
                <Line
                  type="monotone"
                  dataKey="treatment"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Treatment (v4.0.0)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Traffic Split Control */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Traffic Split</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Control</span>
              <span className="font-mono font-semibold">{100 - trafficSplit}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={trafficSplit}
              onChange={(e) => setTrafficSplit(parseInt(e.target.value))}
              className="w-full"
              disabled={test.status === "completed"}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm">Treatment</span>
              <span className="font-mono font-semibold">{trafficSplit}%</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${100 - trafficSplit}%` }}
              />
              <div
                className="bg-purple-500 transition-all"
                style={{ width: `${trafficSplit}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

