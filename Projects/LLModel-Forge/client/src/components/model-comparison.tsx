/**
 * Model/Run Comparison Component - W&B Inspired
 *
 * Features:
 * - Side-by-side config diff
 * - Metric overlay charts
 * - Highlight differences
 * - Parameter comparison table
 */

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ColorDot, MetricChart, getRunColor } from "./wandb-ui";
import {
  GitCompare,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Equal,
  Plus,
  Minus,
  X,
} from "lucide-react";

interface ComparisonRun {
  id: string;
  name: string;
  metrics: Record<string, number>;
  hyperparameters: Record<string, any>;
  config?: Record<string, any>;
  chartData?: Array<{ step: number; [key: string]: number }>;
}

interface ModelComparisonProps {
  runs: ComparisonRun[];
  onRemoveRun?: (id: string) => void;
  className?: string;
}

type DiffType = "added" | "removed" | "changed" | "unchanged";

interface DiffItem {
  key: string;
  type: DiffType;
  values: (any | undefined)[];
}

export function ModelComparison({ runs, onRemoveRun, className }: ModelComparisonProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["metrics", "hyperparameters"])
  );
  const [selectedMetric, setSelectedMetric] = useState<string>("accuracy");

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Calculate diffs
  const metricsDiff = useMemo(() => {
    if (runs.length < 2) return [];

    const allKeys = new Set<string>();
    runs.forEach((run) => {
      Object.keys(run.metrics).forEach((key) => allKeys.add(key));
    });

    return Array.from(allKeys).map((key) => {
      const values = runs.map((run) => run.metrics[key]);
      const allSame = values.every((v) => v === values[0]);
      const hasValue = values.filter((v) => v !== undefined);

      let type: DiffType = "unchanged";
      if (!allSame) type = "changed";
      if (hasValue.length < runs.length) type = hasValue.length === 0 ? "removed" : "added";

      return { key, type, values };
    });
  }, [runs]);

  const hyperparamsDiff = useMemo(() => {
    if (runs.length < 2) return [];

    const allKeys = new Set<string>();
    runs.forEach((run) => {
      Object.keys(run.hyperparameters).forEach((key) => allKeys.add(key));
    });

    return Array.from(allKeys).map((key) => {
      const values = runs.map((run) => run.hyperparameters[key]);
      const allSame = values.every((v) => JSON.stringify(v) === JSON.stringify(values[0]));
      const hasValue = values.filter((v) => v !== undefined);

      let type: DiffType = "unchanged";
      if (!allSame) type = "changed";
      if (hasValue.length < runs.length) type = hasValue.length === 0 ? "removed" : "added";

      return { key, type, values };
    });
  }, [runs]);

  // Chart data for selected metric
  const chartLines = useMemo(() => {
    return runs.map((run, i) => ({
      key: `run_${i}`,
      name: run.name,
      color: getRunColor(i),
    }));
  }, [runs]);

  // Merge chart data
  const mergedChartData = useMemo(() => {
    if (!runs[0]?.chartData) return [];

    const maxSteps = Math.max(...runs.map((r) => r.chartData?.length || 0));
    return Array.from({ length: maxSteps }, (_, step) => {
      const point: Record<string, number> = { step };
      runs.forEach((run, i) => {
        if (run.chartData?.[step]) {
          point[`run_${i}`] = run.chartData[step][selectedMetric] ?? 0;
        }
      });
      return point;
    });
  }, [runs, selectedMetric]);

  // Get diff icon and color
  const getDiffStyle = (type: DiffType) => {
    switch (type) {
      case "added":
        return { icon: <Plus className="h-3 w-3" />, bg: "bg-green-500/10", text: "text-green-500" };
      case "removed":
        return { icon: <Minus className="h-3 w-3" />, bg: "bg-red-500/10", text: "text-red-500" };
      case "changed":
        return { icon: <ArrowRight className="h-3 w-3" />, bg: "bg-yellow-500/10", text: "text-yellow-500" };
      default:
        return { icon: <Equal className="h-3 w-3" />, bg: "", text: "text-muted-foreground" };
    }
  };

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return "-";
    if (typeof value === "number") {
      return value < 1 && value > 0 ? value.toFixed(4) : value.toFixed(2);
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  if (runs.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
        <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">No runs to compare</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Select at least 2 runs to compare their configurations and metrics.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with run badges */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <span className="font-semibold">Comparing {runs.length} Runs</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {runs.map((run, i) => (
            <div
              key={run.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border"
            >
              <ColorDot color={getRunColor(i)} size="sm" />
              <span className="text-sm font-medium truncate max-w-[150px]">{run.name}</span>
              {onRemoveRun && (
                <button
                  onClick={() => onRemoveRun(run.id)}
                  className="p-0.5 hover:bg-background rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics Chart Overlay */}
      {mergedChartData.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Metric Comparison</h4>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm bg-muted border border-border rounded-md px-2 py-1"
            >
              <option value="accuracy">Accuracy</option>
              <option value="loss">Loss</option>
              <option value="f1Score">F1 Score</option>
              <option value="valAccuracy">Val Accuracy</option>
              <option value="valLoss">Val Loss</option>
            </select>
          </div>
          <MetricChart
            data={mergedChartData}
            lines={chartLines}
            xKey="step"
            height={250}
            syncId="comparison"
          />
        </div>
      )}

      {/* Metrics Diff */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50"
          onClick={() => toggleSection("metrics")}
        >
          <div className="flex items-center gap-2">
            {expandedSections.has("metrics") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Metrics</span>
            <span className="text-xs text-muted-foreground">
              ({metricsDiff.filter((d) => d.type === "changed").length} differences)
            </span>
          </div>
        </button>

        {expandedSections.has("metrics") && (
          <div className="border-t border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-1/4">
                    Metric
                  </th>
                  {runs.map((run, i) => (
                    <th key={run.id} className="px-4 py-2 text-left text-xs font-medium uppercase">
                      <div className="flex items-center gap-2">
                        <ColorDot color={getRunColor(i)} size="sm" />
                        <span className="truncate max-w-[100px]">{run.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricsDiff.map((diff) => {
                  const style = getDiffStyle(diff.type);
                  return (
                    <tr
                      key={diff.key}
                      className={cn("border-t border-border/50", style.bg)}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={style.text}>{style.icon}</span>
                          <span className="text-sm font-medium">{diff.key}</span>
                        </div>
                      </td>
                      {diff.values.map((value, i) => (
                        <td
                          key={i}
                          className={cn(
                            "px-4 py-2 text-sm font-mono",
                            diff.type === "changed" && i === 0 && "bg-red-500/5",
                            diff.type === "changed" && i > 0 && "bg-green-500/5"
                          )}
                        >
                          {formatValue(value)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hyperparameters Diff */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50"
          onClick={() => toggleSection("hyperparameters")}
        >
          <div className="flex items-center gap-2">
            {expandedSections.has("hyperparameters") ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">Hyperparameters</span>
            <span className="text-xs text-muted-foreground">
              ({hyperparamsDiff.filter((d) => d.type === "changed").length} differences)
            </span>
          </div>
        </button>

        {expandedSections.has("hyperparameters") && (
          <div className="border-t border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-1/4">
                    Parameter
                  </th>
                  {runs.map((run, i) => (
                    <th key={run.id} className="px-4 py-2 text-left text-xs font-medium uppercase">
                      <div className="flex items-center gap-2">
                        <ColorDot color={getRunColor(i)} size="sm" />
                        <span className="truncate max-w-[100px]">{run.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hyperparamsDiff.map((diff) => {
                  const style = getDiffStyle(diff.type);
                  return (
                    <tr
                      key={diff.key}
                      className={cn("border-t border-border/50", style.bg)}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={style.text}>{style.icon}</span>
                          <span className="text-sm font-medium">{diff.key}</span>
                        </div>
                      </td>
                      {diff.values.map((value, i) => (
                        <td
                          key={i}
                          className={cn(
                            "px-4 py-2 text-sm font-mono",
                            diff.type === "changed" && i === 0 && "bg-red-500/5",
                            diff.type === "changed" && i > 0 && "bg-green-500/5"
                          )}
                        >
                          {formatValue(value)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <ArrowRight className="h-3 w-3" />
          </span>
          <span>Changed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-500/10 flex items-center justify-center text-green-500">
            <Plus className="h-3 w-3" />
          </span>
          <span>Added</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-500/10 flex items-center justify-center text-red-500">
            <Minus className="h-3 w-3" />
          </span>
          <span>Removed</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded flex items-center justify-center">
            <Equal className="h-3 w-3" />
          </span>
          <span>Unchanged</span>
        </div>
      </div>
    </div>
  );
}

export default ModelComparison;

