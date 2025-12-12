import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useModels, usePromoteModel, useDeleteModel, type Model } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Box,
  Clock,
  GitBranch,
  MoreVertical,
  AlertTriangle,
  Rocket,
  Archive,
  Loader2,
  Trash2,
  ArrowUpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: models = [], isLoading, error } = useModels();
  const promoteModel = usePromoteModel();
  const deleteModel = useDeleteModel();
  const { toast } = useToast();

  const filteredModels = models.filter((model: Model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (model.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (model.tags as string[])?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = !selectedStage || model.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  const stageCounts = {
    all: models.length,
    development: models.filter((m: Model) => m.stage === "development").length,
    staging: models.filter((m: Model) => m.stage === "staging").length,
    production: models.filter((m: Model) => m.stage === "production").length,
    archived: models.filter((m: Model) => m.stage === "archived").length,
  };

  const handlePromote = async (id: string, stage: string) => {
    try {
      await promoteModel.mutateAsync({ id, stage });
      toast({ title: "Success", description: `Model promoted to ${stage}` });
      setMenuOpen(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to promote model", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;
    try {
      await deleteModel.mutateAsync(id);
      toast({ title: "Success", description: "Model deleted successfully" });
      setMenuOpen(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete model", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Failed to load models. Please try again.
      </div>
    );
  }

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
        {filteredModels.map((model: Model) => {
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
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === model.id ? null : model.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {menuOpen === model.id && (
                      <div className="absolute right-0 top-8 z-10 w-48 rounded-md border border-border bg-popover p-1 shadow-md">
                        {model.stage !== "production" && (
                          <button
                            onClick={() => handlePromote(model.id, "production")}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted"
                          >
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                            Promote to Production
                          </button>
                        )}
                        {model.stage !== "staging" && model.stage !== "production" && (
                          <button
                            onClick={() => handlePromote(model.id, "staging")}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted"
                          >
                            <ArrowUpCircle className="h-4 w-4 text-yellow-500" />
                            Promote to Staging
                          </button>
                        )}
                        <button
                          onClick={() => handlePromote(model.id, "archived")}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-muted"
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </button>
                        <button
                          onClick={() => handleDelete(model.id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
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
                  {model.accuracy && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-mono font-semibold text-green-500">
                        {(model.accuracy * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {model.f1Score && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">F1 Score</p>
                      <p className="font-mono font-semibold">
                        {model.f1Score.toFixed(3)}
                      </p>
                    </div>
                  )}
                  {model.latency && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Latency</p>
                      <p className="font-mono font-semibold">
                        {model.latency}ms
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {(model.tags as string[])?.map((tag: string) => (
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
                    {new Date(model.updatedAt).toLocaleDateString()}
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
