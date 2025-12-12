import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  GitBranch,
  Database,
  Cpu,
  BarChart3,
  Rocket
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelineStep {
  id: string;
  name: string;
  type: "data" | "training" | "evaluation" | "deployment";
  status: "pending" | "running" | "completed" | "failed";
  duration?: string;
  logs?: string[];
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  status: "idle" | "running" | "completed" | "failed";
  lastRun: string;
  schedule: string;
  steps: PipelineStep[];
  trigger: "manual" | "scheduled" | "event";
}

const pipelines: Pipeline[] = [
  {
    id: "pipe_001",
    name: "fraud-detection-training",
    description: "End-to-end training pipeline for fraud detection model",
    status: "running",
    lastRun: "2024-02-13 10:30",
    schedule: "Daily at 2:00 AM",
    trigger: "scheduled",
    steps: [
      { id: "s1", name: "Data Ingestion", type: "data", status: "completed", duration: "5m 23s" },
      { id: "s2", name: "Feature Engineering", type: "data", status: "completed", duration: "12m 45s" },
      { id: "s3", name: "Model Training", type: "training", status: "running", duration: "23m..." },
      { id: "s4", name: "Model Evaluation", type: "evaluation", status: "pending" },
      { id: "s5", name: "Deploy to Staging", type: "deployment", status: "pending" },
    ]
  },
  {
    id: "pipe_002",
    name: "churn-prediction-retrain",
    description: "Weekly retraining pipeline for customer churn model",
    status: "completed",
    lastRun: "2024-02-12 14:00",
    schedule: "Weekly on Monday",
    trigger: "scheduled",
    steps: [
      { id: "s1", name: "Data Extraction", type: "data", status: "completed", duration: "8m 12s" },
      { id: "s2", name: "Data Validation", type: "data", status: "completed", duration: "2m 30s" },
      { id: "s3", name: "Model Training", type: "training", status: "completed", duration: "45m 18s" },
      { id: "s4", name: "A/B Test Setup", type: "evaluation", status: "completed", duration: "3m 05s" },
    ]
  },
  {
    id: "pipe_003",
    name: "sentiment-model-deploy",
    description: "Production deployment pipeline with blue-green strategy",
    status: "failed",
    lastRun: "2024-02-11 09:15",
    schedule: "On demand",
    trigger: "manual",
    steps: [
      { id: "s1", name: "Model Validation", type: "evaluation", status: "completed", duration: "4m 50s" },
      { id: "s2", name: "Integration Tests", type: "evaluation", status: "completed", duration: "15m 22s" },
      { id: "s3", name: "Deploy Blue", type: "deployment", status: "failed", duration: "2m 10s" },
      { id: "s4", name: "Health Check", type: "deployment", status: "pending" },
      { id: "s5", name: "Switch Traffic", type: "deployment", status: "pending" },
    ]
  },
  {
    id: "pipe_004",
    name: "data-quality-check",
    description: "Continuous data quality monitoring pipeline",
    status: "idle",
    lastRun: "2024-02-13 00:00",
    schedule: "Every 6 hours",
    trigger: "scheduled",
    steps: [
      { id: "s1", name: "Schema Validation", type: "data", status: "pending" },
      { id: "s2", name: "Data Profiling", type: "data", status: "pending" },
      { id: "s3", name: "Drift Detection", type: "evaluation", status: "pending" },
      { id: "s4", name: "Alert Generation", type: "deployment", status: "pending" },
    ]
  },
];

const stepTypeConfig = {
  data: { icon: Database, color: "text-blue-500" },
  training: { icon: Cpu, color: "text-purple-500" },
  evaluation: { icon: BarChart3, color: "text-yellow-500" },
  deployment: { icon: Rocket, color: "text-green-500" },
};

const statusConfig = {
  pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
  running: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/10", animate: true },
  completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  failed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const pipelineStatusConfig = {
  idle: { color: "text-muted-foreground bg-muted/10 border-muted-foreground/30", label: "Idle" },
  running: { color: "text-blue-500 bg-blue-500/10 border-blue-500/30", label: "Running" },
  completed: { color: "text-green-500 bg-green-500/10 border-green-500/30", label: "Completed" },
  failed: { color: "text-destructive bg-destructive/10 border-destructive/30", label: "Failed" },
};

export default function Pipelines() {
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(pipelines[0].id);

  const activePipeline = pipelines.find(p => p.id === selectedPipeline);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML Pipelines</h1>
          <p className="text-muted-foreground mt-2">
            Orchestrate and monitor your machine learning workflows.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" /> Create Pipeline
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pipelines</p>
              <p className="text-2xl font-bold font-mono">{pipelines.length}</p>
            </div>
            <GitBranch className="h-8 w-8 text-muted-foreground/50" />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Running</p>
              <p className="text-2xl font-bold font-mono text-blue-500">
                {pipelines.filter(p => p.status === "running").length}
              </p>
            </div>
            <Loader2 className="h-8 w-8 text-blue-500/50 animate-spin" />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-2xl font-bold font-mono text-green-500">
                {pipelines.filter(p => p.status === "completed").length}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold font-mono text-destructive">
                {pipelines.filter(p => p.status === "failed").length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-destructive/50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            All Pipelines
          </h2>
          {pipelines.map((pipeline) => (
            <Card
              key={pipeline.id}
              onClick={() => setSelectedPipeline(pipeline.id)}
              className={cn(
                "cursor-pointer transition-all border-border hover:border-primary/50",
                selectedPipeline === pipeline.id && "border-primary bg-primary/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{pipeline.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {pipeline.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    selectedPipeline === pipeline.id && "rotate-90 text-primary"
                  )} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className={pipelineStatusConfig[pipeline.status].color}>
                    {pipelineStatusConfig[pipeline.status].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{pipeline.lastRun}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline Details */}
        {activePipeline && (
          <Card className="lg:col-span-2 border-border bg-card">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activePipeline.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activePipeline.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  {activePipeline.status === "running" ? (
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors">
                      <Pause className="h-4 w-4" /> Pause
                    </button>
                  ) : (
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20 transition-colors">
                      <Play className="h-4 w-4" /> Run
                    </button>
                  )}
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors">
                    <RotateCcw className="h-4 w-4" /> Retry
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                <span>Schedule: {activePipeline.schedule}</span>
                <span>•</span>
                <span>Trigger: {activePipeline.trigger}</span>
                <span>•</span>
                <span>Last run: {activePipeline.lastRun}</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Pipeline Steps</h3>
              <div className="space-y-3">
                {activePipeline.steps.map((step, index) => {
                  const StepIcon = stepTypeConfig[step.type].icon;
                  const StatusIcon = statusConfig[step.status].icon;
                  return (
                    <div key={step.id} className="relative">
                      {index < activePipeline.steps.length - 1 && (
                        <div className="absolute left-5 top-10 w-0.5 h-6 bg-border" />
                      )}
                      <div className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                        statusConfig[step.status].bg,
                        "border-border"
                      )}>
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          statusConfig[step.status].bg
                        )}>
                          <StepIcon className={cn("h-5 w-5", stepTypeConfig[step.type].color)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.name}</span>
                            <Badge variant="outline" className="text-[10px] h-5">
                              {step.type}
                            </Badge>
                          </div>
                          {step.duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {step.duration}
                            </p>
                          )}
                        </div>
                        <StatusIcon className={cn(
                          "h-5 w-5",
                          statusConfig[step.status].color,
                          statusConfig[step.status].animate && "animate-spin"
                        )} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

