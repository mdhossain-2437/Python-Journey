/**
 * Experiments Page - W&B Inspired
 *
 * Features:
 * - Advanced runs table with filtering & grouping
 * - Interactive charts with smoothing
 * - Parallel coordinates for hyperparameter analysis
 * - System resource monitoring
 * - Model comparison
 */

import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch,
  BarChart3,
  Cpu,
  GitCompare,
  Play,
  Square,
  Plus,
  Settings2,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useExperiments } from "@/hooks/use-api";

// Import W&B-inspired components
import { RunsTable, Run } from "@/components/runs-table";
import {
  MetricChart,
  SmoothingSlider,
  StatusBadge,
  ColorDot,
  getRunColor,
  Kbd,
} from "@/components/wandb-ui";
import { ParallelCoordinates } from "@/components/parallel-coordinates";
import { SystemMonitor, SystemMonitorSidebar } from "@/components/system-monitor";
import { ModelComparison } from "@/components/model-comparison";

// Generate sample chart data
const generateChartData = (epochs: number, baseAcc: number, noise: number = 0.02) => {
  return Array.from({ length: epochs }, (_, i) => ({
    step: i + 1,
    accuracy: Math.min(0.99, baseAcc + (i / epochs) * 0.3 + (Math.random() - 0.5) * noise),
    loss: Math.max(0.01, 0.8 - (i / epochs) * 0.7 + (Math.random() - 0.5) * noise),
    valAccuracy: Math.min(0.98, baseAcc + (i / epochs) * 0.25 + (Math.random() - 0.5) * noise * 1.5),
    valLoss: Math.max(0.02, 0.85 - (i / epochs) * 0.6 + (Math.random() - 0.5) * noise * 1.5),
  }));
};

// Sample runs data
const sampleRuns: Run[] = [
  {
    id: "exp_001",
    name: "XGBoost_Optimized_v1",
    status: "completed",
    duration: "45m",
    createdAt: "2024-02-10T10:30:00",
    metrics: { accuracy: 0.942, loss: 0.058, f1Score: 0.92, epochs: 100 },
    hyperparameters: { learningRate: 0.01, batchSize: 32, maxDepth: 10, nEstimators: 100 },
    tags: ["production", "fraud"],
  },
  {
    id: "exp_002",
    name: "ResNet50_Transfer",
    status: "failed",
    duration: "2h 15m",
    createdAt: "2024-02-11T14:20:00",
    metrics: { accuracy: 0.885, loss: 0.115, f1Score: 0.86, epochs: 50 },
    hyperparameters: { learningRate: 0.001, batchSize: 64, epochs: 50, optimizer: "Adam" },
    tags: ["vision", "transfer"],
  },
  {
    id: "exp_003",
    name: "BERT_FineTune_Base",
    status: "running",
    duration: "1h 20m",
    createdAt: "2024-02-12T09:15:00",
    metrics: { accuracy: 0.912, loss: 0.088, f1Score: 0.89, epochs: 35 },
    hyperparameters: { learningRate: 2e-5, batchSize: 16, epochs: 5, warmupSteps: 500 },
    tags: ["nlp", "bert"],
  },
  {
    id: "exp_004",
    name: "XGBoost_Optimized_v2",
    status: "completed",
    duration: "50m",
    createdAt: "2024-02-13T08:45:00",
    metrics: { accuracy: 0.956, loss: 0.044, f1Score: 0.94, epochs: 150 },
    hyperparameters: { learningRate: 0.05, batchSize: 64, maxDepth: 12, nEstimators: 150 },
    tags: ["production", "fraud", "v2"],
  },
  {
    id: "exp_005",
    name: "LightGBM_Churn",
    status: "completed",
    duration: "25m",
    createdAt: "2024-02-13T11:00:00",
    metrics: { accuracy: 0.891, loss: 0.109, f1Score: 0.87, epochs: 80 },
    hyperparameters: { learningRate: 0.03, batchSize: 128, numLeaves: 31, featureFraction: 0.8 },
    tags: ["churn", "lightgbm"],
  },
];

// Parallel coordinates data
const parallelData = sampleRuns.map((run) => ({
  id: run.id,
  name: run.name,
  values: {
    learningRate: run.hyperparameters.learningRate,
    batchSize: run.hyperparameters.batchSize,
    accuracy: run.metrics.accuracy,
    loss: run.metrics.loss,
    f1Score: run.metrics.f1Score,
  },
}));

export default function Experiments() {
  const [activeTab, setActiveTab] = useState("runs");
  const [smoothing, setSmoothing] = useState(0.6);
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());
  const [visibleRunIds, setVisibleRunIds] = useState<Set<string>>(
    new Set(sampleRuns.map((r) => r.id))
  );
  const [compareRuns, setCompareRuns] = useState<string[]>([]);
  const [highlightedRunId, setHighlightedRunId] = useState<string | null>(null);

  // API data (fallback to sample if not available)
  const { data: apiExperiments, isLoading } = useExperiments();

  const runs = useMemo(() => {
    if (apiExperiments && apiExperiments.length > 0) {
      return apiExperiments.map((exp: any): Run => ({
        id: exp.id,
        name: exp.name,
        status: exp.status || "pending",
        duration: exp.duration,
        createdAt: exp.createdAt,
        metrics: exp.metrics || {},
        hyperparameters: exp.hyperparameters || {},
        tags: [],
      }));
    }
    return sampleRuns;
  }, [apiExperiments]);

  // Chart data for visible runs
  const chartData = useMemo(() => {
    const visibleRuns = runs.filter((r) => visibleRunIds.has(r.id));
    if (visibleRuns.length === 0) return [];

    // Generate merged data
    const maxSteps = 50;
    return Array.from({ length: maxSteps }, (_, step) => {
      const point: Record<string, number> = { step: step + 1 };
      visibleRuns.forEach((run, i) => {
        const baseAcc = run.metrics.accuracy || 0.7;
        point[`acc_${run.id}`] = Math.min(0.99, baseAcc - 0.3 + (step / maxSteps) * 0.35);
        point[`loss_${run.id}`] = Math.max(0.01, 0.9 - (step / maxSteps) * 0.8);
      });
      return point;
    });
  }, [runs, visibleRunIds]);

  // Chart lines config
  const chartLines = useMemo(() => {
    const visibleRuns = runs.filter((r) => visibleRunIds.has(r.id));
    return visibleRuns.flatMap((run, i) => [
      {
        key: `acc_${run.id}`,
        name: `${run.name} - Acc`,
        color: getRunColor(runs.findIndex((r) => r.id === run.id)),
        dashed: false,
      },
    ]);
  }, [runs, visibleRunIds]);

  // Toggle run visibility
  const handleToggleVisibility = useCallback((runId: string, visible: boolean) => {
    setVisibleRunIds((prev) => {
      const next = new Set(prev);
      if (visible) {
        next.add(runId);
      } else {
        next.delete(runId);
      }
      return next;
    });
  }, []);

  // Handle compare
  const handleCompare = useCallback((runIds: string[]) => {
    setCompareRuns(runIds);
    setActiveTab("compare");
  }, []);

  // Comparison runs data
  const comparisonRuns = useMemo(() => {
    return compareRuns.map((id) => {
      const run = runs.find((r) => r.id === id);
      if (!run) return null;
      return {
        id: run.id,
        name: run.name,
        metrics: run.metrics,
        hyperparameters: run.hyperparameters,
        chartData: generateChartData(50, run.metrics.accuracy || 0.8),
      };
    }).filter(Boolean) as any[];
  }, [compareRuns, runs]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiment Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor training runs, compare metrics, and analyze hyperparameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Experiment
          </button>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          Press <Kbd>/</Kbd> to search
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> for command palette
        </span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="runs" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Runs
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="parallel" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Hyperparameters
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Compare
            {compareRuns.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                {compareRuns.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <RunsTable
              runs={runs}
              visibleRunIds={visibleRunIds}
              onRunClick={(run) => setHighlightedRunId(run.id)}
              onRunToggleVisibility={handleToggleVisibility}
              onRunsCompare={handleCompare}
              onRunsDelete={(ids) => console.log("Delete:", ids)}
            />
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Training Metrics</CardTitle>
                <SmoothingSlider value={smoothing} onChange={setSmoothing} />
              </CardHeader>
              <CardContent>
                <MetricChart
                  data={chartData}
                  lines={chartLines}
                  xKey="step"
                  height={350}
                  smoothing={smoothing}
                  showBrush={true}
                  syncId="metrics"
                />
              </CardContent>
            </Card>

            {/* Run visibility toggles */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm">Visible Runs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {runs.map((run, i) => {
                  const isVisible = visibleRunIds.has(run.id);
                  return (
                    <button
                      key={run.id}
                      onClick={() => handleToggleVisibility(run.id, !isVisible)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                        isVisible ? "bg-muted" : "opacity-50 hover:opacity-75"
                      }`}
                    >
                      <ColorDot color={getRunColor(i)} size="sm" pulse={run.status === "running"} />
                      <span className="truncate flex-1 text-left">{run.name}</span>
                      <StatusBadge status={run.status} size="sm" showPulse={false} />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Parallel Coordinates Tab */}
        <TabsContent value="parallel" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Hyperparameter Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualize the relationship between hyperparameters and metrics.
                Hover over lines to see details.
              </p>
            </CardHeader>
            <CardContent>
              <ParallelCoordinates
                data={parallelData}
                axes={[
                  { key: "learningRate", label: "Learning Rate", format: (v) => v.toExponential(1) },
                  { key: "batchSize", label: "Batch Size", format: (v) => v.toFixed(0) },
                  { key: "accuracy", label: "Accuracy", format: (v) => v.toFixed(3) },
                  { key: "loss", label: "Loss", format: (v) => v.toFixed(3) },
                  { key: "f1Score", label: "F1 Score", format: (v) => v.toFixed(3) },
                ]}
                height={400}
                highlightedId={highlightedRunId}
                onLineClick={(id) => setHighlightedRunId(id === highlightedRunId ? null : id)}
                onLineHover={(id) => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <SystemMonitor isLive={runs.some((r) => r.status === "running")} />
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="space-y-4">
          {compareRuns.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12">
                <ModelComparison
                  runs={[]}
                  onRemoveRun={(id) => setCompareRuns((prev) => prev.filter((r) => r !== id))}
                />
              </CardContent>
            </Card>
          ) : (
            <ModelComparison
              runs={comparisonRuns}
              onRemoveRun={(id) => setCompareRuns((prev) => prev.filter((r) => r !== id))}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

