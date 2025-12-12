import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Plus,
  Box,
  Clock,
  GitBranch,
  Download,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Rocket,
  Archive
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
  version: string;
  stage: "development" | "staging" | "production" | "archived";
  framework: string;
  metrics: {
    accuracy?: number;
    f1Score?: number;
    latency?: number;
  };
  author: string;
  createdAt: string;
  lastUpdated: string;
  description: string;
  tags: string[];
}

const models: Model[] = [
  {
    id: "model_001",
    name: "fraud-detection-xgboost",
    version: "3.2.1",
    stage: "production",
    framework: "XGBoost",
    metrics: { accuracy: 0.956, f1Score: 0.942, latency: 12 },
    author: "Jane Smith",
    createdAt: "2024-01-15",
    lastUpdated: "2024-02-10",
    description: "Production fraud detection model for real-time transaction scoring",
    tags: ["fraud", "real-time", "critical"]
  },
  {
    id: "model_002",
    name: "customer-churn-predictor",
    version: "2.0.0",
    stage: "staging",
    framework: "LightGBM",
    metrics: { accuracy: 0.891, f1Score: 0.876, latency: 8 },
    author: "John Doe",
    createdAt: "2024-02-01",
    lastUpdated: "2024-02-12",
    description: "Customer churn prediction model with SHAP explanations",
    tags: ["churn", "customer-analytics"]
  },
  {
    id: "model_003",
    name: "sentiment-bert-large",
    version: "1.5.0",
    stage: "production",
    framework: "PyTorch",
    metrics: { accuracy: 0.923, f1Score: 0.918, latency: 45 },
    author: "Alice Chen",
    createdAt: "2023-12-20",
    lastUpdated: "2024-01-28",
    description: "BERT-based sentiment analysis for customer reviews",
    tags: ["nlp", "sentiment", "bert"]
  },
  {
    id: "model_004",
    name: "demand-forecasting-lstm",
    version: "4.1.0",
    stage: "development",
    framework: "TensorFlow",
    metrics: { accuracy: 0.845, latency: 23 },
    author: "Bob Wilson",
    createdAt: "2024-02-08",
    lastUpdated: "2024-02-13",
    description: "LSTM model for multi-step demand forecasting",
    tags: ["forecasting", "time-series", "lstm"]
  },
  {
    id: "model_005",
    name: "image-classifier-resnet",
    version: "1.0.0",
    stage: "archived",
    framework: "PyTorch",
    metrics: { accuracy: 0.782, f1Score: 0.765, latency: 67 },
    author: "Jane Smith",
    createdAt: "2023-08-15",
    lastUpdated: "2023-11-20",
    description: "ResNet50 model for product image classification (deprecated)",
    tags: ["cv", "classification", "legacy"]
  },
];

const stageConfig = {
  development: {
    icon: GitBranch,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    label: "Development"
  },
  staging: {
    icon: AlertTriangle,
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    label: "Staging"
  },
  production: {
    icon: Rocket,
    color: "text-green-500 bg-green-500/10 border-green-500/30",
    label: "Production"
  },
  archived: {
    icon: Archive,
    color: "text-muted-foreground bg-muted/10 border-muted-foreground/30",
    label: "Archived"
  },
};

export default function ModelRegistry() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = !selectedStage || model.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const stageCounts = {
    all: models.length,
    development: models.filter(m => m.stage === "development").length,
    staging: models.filter(m => m.stage === "staging").length,
    production: models.filter(m => m.stage === "production").length,
    archived: models.filter(m => m.stage === "archived").length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Registry</h1>
          <p className="text-muted-foreground mt-2">
            Manage, version, and deploy your machine learning models.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" /> Register Model
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Models", value: stageCounts.all, icon: Box },
          { label: "In Production", value: stageCounts.production, icon: Rocket, highlight: true },
          { label: "In Staging", value: stageCounts.staging, icon: AlertTriangle },
          { label: "In Development", value: stageCounts.development, icon: GitBranch },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={cn(
                    "text-2xl font-bold font-mono mt-1",
                    stat.highlight && "text-green-500"
                  )}>
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={cn(
                  "h-8 w-8",
                  stat.highlight ? "text-green-500/50" : "text-muted-foreground/50"
                )} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models, tags..."
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStage(null)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
              !selectedStage
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            )}
          >
            All ({stageCounts.all})
          </button>
          {Object.entries(stageConfig).map(([stage, config]) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
                selectedStage === stage
                  ? config.color
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {config.label} ({stageCounts[stage as keyof typeof stageCounts]})
            </button>
          ))}
        </div>
      </div>

      {/* Model Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredModels.map((model) => {
          const StageIcon = stageConfig[model.stage].icon;
          return (
            <Card
              key={model.id}
              className="border-border bg-card hover:border-primary/50 transition-all cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-semibold truncate">
                      {model.name}
                    </CardTitle>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={stageConfig[model.stage].color}>
                    <StageIcon className="h-3 w-3 mr-1" />
                    {stageConfig[model.stage].label}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    v{model.version}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {model.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
                  {model.metrics.accuracy && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-mono font-semibold text-green-500">
                        {(model.metrics.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {model.metrics.f1Score && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">F1 Score</p>
                      <p className="font-mono font-semibold">
                        {model.metrics.f1Score.toFixed(3)}
                      </p>
                    </div>
                  )}
                  {model.metrics.latency && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Latency</p>
                      <p className="font-mono font-semibold">
                        {model.metrics.latency}ms
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {model.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {model.lastUpdated}
                  </span>
                  <span>{model.framework}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <Box className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No models found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}

