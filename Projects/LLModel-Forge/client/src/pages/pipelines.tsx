/**
 * Advanced Pipelines Page with DAG Visualization
 *
 * Features:
 * - Interactive DAG/Lineage graph
 * - Real-time pipeline execution
 * - Step-by-step logs
 * - Pipeline comparison
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronDown,
  GitBranch,
  Database,
  Cpu,
  BarChart3,
  Rocket,
  Eye,
  Settings,
  Calendar,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePipelines, useRunPipeline, useStopPipeline } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { DAGGraph, DAGNode, DAGEdge } from "@/components/neural-network-viz";
import { StatusBadge, Sparkline, getRunColor } from "@/components/wandb-ui";
import { RealTimeMetricStream } from "@/components/advanced-viz";

interface PipelineStep {
  id: string;
  name: string;
  stepType: string;
  status: "pending" | "running" | "completed" | "failed";
  duration?: string | null;
  logs?: string[];
  order: number;
}

interface Pipeline {
  id: string;
  name: string;
  description?: string | null;
  status: "idle" | "running" | "completed" | "failed";
  lastRunAt?: string | null;
  schedule?: string | null;
  triggerType?: string;
  steps?: PipelineStep[];
}

// Convert pipeline steps to DAG nodes
function pipelineToDAG(pipeline: Pipeline): { nodes: DAGNode[]; edges: DAGEdge[] } {
  const nodes: DAGNode[] = [];
  const edges: DAGEdge[] = [];

  // Add data source node
  nodes.push({
    id: "source",
    type: "data",
    label: "Data Source",
    description: "Input data for pipeline",
    status: "completed",
  });

  // Add step nodes
  (pipeline.steps || []).forEach((step, i) => {
    nodes.push({
      id: step.id,
      type: step.stepType === "training" ? "model" :
            step.stepType === "data" ? "transform" :
            step.stepType === "deployment" ? "artifact" : "metric",
      label: step.name,
      description: `Step ${i + 1} of pipeline`,
      status: step.status,
      metadata: { duration: step.duration },
    });

    // Connect to previous
    const prevId = i === 0 ? "source" : pipeline.steps![i - 1].id;
    edges.push({ from: prevId, to: step.id });
  });

  // Add output node
  if (pipeline.steps && pipeline.steps.length > 0) {
    nodes.push({
      id: "output",
      type: "artifact",
      label: "Output",
      description: "Pipeline output artifact",
      status: pipeline.status === "completed" ? "completed" : "pending",
    });
    edges.push({
      from: pipeline.steps[pipeline.steps.length - 1].id,
      to: "output"
    });
  }

  return { nodes, edges };
}

// Sample data for demo
const samplePipelines: Pipeline[] = [
  {
    id: "pipe_001",
    name: "fraud-detection-training",
    description: "End-to-end training pipeline for fraud detection model",
    status: "running",
    lastRunAt: "2024-02-13T10:30:00",
    schedule: "Daily at 2:00 AM",
    triggerType: "scheduled",
    steps: [
      { id: "s1", name: "Data Ingestion", stepType: "data", status: "completed", duration: "5m 23s", order: 1 },
      { id: "s2", name: "Feature Engineering", stepType: "data", status: "completed", duration: "12m 45s", order: 2 },
      { id: "s3", name: "Model Training", stepType: "training", status: "running", duration: "23m...", order: 3 },
      { id: "s4", name: "Model Evaluation", stepType: "evaluation", status: "pending", order: 4 },
      { id: "s5", name: "Deploy to Staging", stepType: "deployment", status: "pending", order: 5 },
    ]
  },
  {
    id: "pipe_002",
    name: "churn-prediction-retrain",
    description: "Weekly retraining pipeline for customer churn model",
    status: "completed",
    lastRunAt: "2024-02-12T14:00:00",
    schedule: "Weekly on Monday",
    triggerType: "scheduled",
    steps: [
      { id: "s1", name: "Data Extraction", stepType: "data", status: "completed", duration: "8m 12s", order: 1 },
      { id: "s2", name: "Data Validation", stepType: "data", status: "completed", duration: "2m 30s", order: 2 },
      { id: "s3", name: "Model Training", stepType: "training", status: "completed", duration: "45m 18s", order: 3 },
      { id: "s4", name: "A/B Test Setup", stepType: "evaluation", status: "completed", duration: "3m 05s", order: 4 },
    ]
  },
  {
    id: "pipe_003",
    name: "sentiment-model-deploy",
    description: "Production deployment pipeline with blue-green strategy",
    status: "failed",
    lastRunAt: "2024-02-11T09:15:00",
    schedule: "On demand",
    triggerType: "manual",
    steps: [
      { id: "s1", name: "Model Validation", stepType: "evaluation", status: "completed", duration: "4m 50s", order: 1 },
      { id: "s2", name: "Integration Tests", stepType: "evaluation", status: "completed", duration: "15m 22s", order: 2 },
      { id: "s3", name: "Deploy Blue", stepType: "deployment", status: "failed", duration: "2m 10s", order: 3 },
      { id: "s4", name: "Health Check", stepType: "deployment", status: "pending", order: 4 },
      { id: "s5", name: "Switch Traffic", stepType: "deployment", status: "pending", order: 5 },
    ]
  },
];

// Step type icons
const stepTypeIcons: Record<string, React.ReactNode> = {
  data: <Database className="h-4 w-4" />,
  training: <Cpu className="h-4 w-4" />,
  evaluation: <BarChart3 className="h-4 w-4" />,
  deployment: <Rocket className="h-4 w-4" />,
};

// Status colors
const statusColors: Record<string, string> = {
  pending: "text-gray-500 bg-gray-500/10",
  running: "text-blue-500 bg-blue-500/10",
  completed: "text-green-500 bg-green-500/10",
  failed: "text-red-500 bg-red-500/10",
  idle: "text-gray-500 bg-gray-500/10",
};

export default function PipelinesPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // API hooks
  const { data: apiPipelines, isLoading } = usePipelines();
  const runPipeline = useRunPipeline();
  const stopPipeline = useStopPipeline();

  // Use API data or sample data
  const pipelines = useMemo(() => {
    if (apiPipelines && apiPipelines.length > 0) {
      return apiPipelines.map((p: any) => ({
        ...p,
        steps: p.steps || [],
      }));
    }
    return samplePipelines;
  }, [apiPipelines]);

  // Stats
  const stats = useMemo(() => ({
    total: pipelines.length,
    running: pipelines.filter((p: Pipeline) => p.status === "running").length,
    completed: pipelines.filter((p: Pipeline) => p.status === "completed").length,
    failed: pipelines.filter((p: Pipeline) => p.status === "failed").length,
  }), [pipelines]);

  // Handle run pipeline
  const handleRun = async (pipeline: Pipeline) => {
    try {
      await runPipeline.mutateAsync(pipeline.id);
      toast({ title: "Pipeline Started", description: `${pipeline.name} is now running` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to start pipeline", variant: "destructive" });
    }
  };

  // Handle stop pipeline
  const handleStop = async (pipeline: Pipeline) => {
    try {
      await stopPipeline.mutateAsync(pipeline.id);
      toast({ title: "Pipeline Stopped", description: `${pipeline.name} has been stopped` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to stop pipeline", variant: "destructive" });
    }
  };

  // Toggle step expansion
  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  // Generate sample metrics for running pipelines
  const [metrics, setMetrics] = useState<Array<{ timestamp: number; value: number }>>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      timestamp: Date.now() - (50 - i) * 1000,
      value: 30 + Math.random() * 40,
    }))
  );

  // Simulate metric updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => [
        ...prev.slice(1),
        { timestamp: Date.now(), value: 30 + Math.random() * 40 }
      ]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML Pipelines</h1>
          <p className="text-muted-foreground mt-2">
            Orchestrate and monitor your machine learning workflows.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" /> New Pipeline
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipelines</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <GitBranch className="h-8 w-8 text-muted-foreground/50" />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-2xl font-bold mt-1 text-blue-500">{stats.running}</p>
            </div>
            <Loader2 className="h-8 w-8 text-blue-500/50 animate-spin" />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold mt-1 text-green-500">{stats.completed}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold mt-1 text-red-500">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500/50" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Pipeline List */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pipelines.map((pipeline: Pipeline) => (
                <button
                  key={pipeline.id}
                  onClick={() => setSelectedPipeline(pipeline)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                    selectedPipeline?.id === pipeline.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          pipeline.status === "running" && "bg-blue-500 animate-pulse",
                          pipeline.status === "completed" && "bg-green-500",
                          pipeline.status === "failed" && "bg-red-500",
                          pipeline.status === "idle" && "bg-gray-500"
                        )} />
                        <span className="font-medium truncate">{pipeline.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {pipeline.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {pipeline.lastRunAt ? new Date(pipeline.lastRunAt).toLocaleDateString() : "Never"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {pipeline.schedule || "Manual"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Details */}
        <div className="space-y-4">
          {selectedPipeline ? (
            <>
              {/* Pipeline Header */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">{selectedPipeline.name}</h2>
                        <Badge className={statusColors[selectedPipeline.status]}>
                          {selectedPipeline.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">{selectedPipeline.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPipeline.status === "running" ? (
                        <button
                          onClick={() => handleStop(selectedPipeline)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20"
                        >
                          <Pause className="h-4 w-4" /> Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRun(selectedPipeline)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                          <Play className="h-4 w-4" /> Run
                        </button>
                      )}
                      <button className="p-2 border border-border rounded-md hover:bg-muted">
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="dag">DAG View</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {/* Steps */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-sm">Pipeline Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {selectedPipeline.steps?.map((step, i) => (
                          <div key={step.id} className="p-4">
                            <button
                              onClick={() => toggleStep(step.id)}
                              className="w-full flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center",
                                  statusColors[step.status]
                                )}>
                                  {step.status === "running" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : step.status === "completed" ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : step.status === "failed" ? (
                                    <XCircle className="h-4 w-4" />
                                  ) : (
                                    <span className="text-xs font-medium">{i + 1}</span>
                                  )}
                                </span>
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    {stepTypeIcons[step.stepType]}
                                    <span className="font-medium">{step.name}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {step.stepType}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {step.duration && (
                                  <span className="text-sm text-muted-foreground">{step.duration}</span>
                                )}
                                {expandedSteps.has(step.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                            </button>

                            {/* Expanded Logs */}
                            {expandedSteps.has(step.id) && (
                              <div className="mt-3 ml-11 p-3 bg-black/20 rounded-md font-mono text-xs">
                                <div className="text-green-400">[{step.name}] Starting...</div>
                                <div className="text-gray-400">[INFO] Processing batch 1/10</div>
                                <div className="text-gray-400">[INFO] Processing batch 2/10</div>
                                {step.status === "completed" && (
                                  <div className="text-green-400">[SUCCESS] Step completed in {step.duration}</div>
                                )}
                                {step.status === "failed" && (
                                  <div className="text-red-400">[ERROR] Step failed: Connection timeout</div>
                                )}
                                {step.status === "running" && (
                                  <div className="text-blue-400 animate-pulse">[RUNNING] Processing...</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dag" className="mt-4">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-sm">Pipeline DAG</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const { nodes, edges } = pipelineToDAG(selectedPipeline);
                        return (
                          <DAGGraph
                            nodes={nodes}
                            edges={edges}
                            onNodeClick={(node) => {
                              toast({
                                title: node.label,
                                description: node.description || `Status: ${node.status}`,
                              });
                            }}
                          />
                        );
                      })()}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logs" className="mt-4">
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-sm">Execution Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-black/90 rounded-lg p-4 font-mono text-xs h-80 overflow-auto">
                        <div className="text-gray-500">[2024-02-13 10:30:00] Pipeline started</div>
                        <div className="text-green-400">[2024-02-13 10:30:01] [Data Ingestion] Starting...</div>
                        <div className="text-gray-400">[2024-02-13 10:30:15] [Data Ingestion] Loading data from S3...</div>
                        <div className="text-gray-400">[2024-02-13 10:32:45] [Data Ingestion] Loaded 1,234,567 records</div>
                        <div className="text-green-400">[2024-02-13 10:35:23] [Data Ingestion] Completed in 5m 23s</div>
                        <div className="text-green-400">[2024-02-13 10:35:24] [Feature Engineering] Starting...</div>
                        <div className="text-gray-400">[2024-02-13 10:40:00] [Feature Engineering] Computing aggregations...</div>
                        <div className="text-gray-400">[2024-02-13 10:45:00] [Feature Engineering] Generated 156 features</div>
                        <div className="text-green-400">[2024-02-13 10:48:09] [Feature Engineering] Completed in 12m 45s</div>
                        <div className="text-blue-400 animate-pulse">[2024-02-13 10:48:10] [Model Training] Training in progress...</div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metrics" className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <RealTimeMetricStream
                      data={metrics}
                      label="CPU Usage"
                      unit="%"
                      threshold={{ value: 80, type: "above", color: "#ef4444" }}
                    />
                    <RealTimeMetricStream
                      data={metrics.map(m => ({ ...m, value: m.value * 0.8 }))}
                      label="Memory Usage"
                      unit="%"
                      color="#22c55e"
                    />
                    <RealTimeMetricStream
                      data={metrics.map(m => ({ ...m, value: m.value * 1.2 }))}
                      label="GPU Utilization"
                      unit="%"
                      color="#f59e0b"
                    />
                    <RealTimeMetricStream
                      data={metrics.map(m => ({ ...m, value: Math.random() * 100 }))}
                      label="Throughput"
                      unit=" rec/s"
                      color="#8b5cf6"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="border-border h-96 flex items-center justify-center">
              <div className="text-center">
                <GitBranch className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">Select a Pipeline</h3>
                <p className="text-muted-foreground mt-1">
                  Choose a pipeline from the list to view details
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

