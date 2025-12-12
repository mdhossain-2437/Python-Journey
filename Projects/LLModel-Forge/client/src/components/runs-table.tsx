/**
 * Advanced Runs Table - W&B Inspired
 *
 * Features:
 * - Customizable columns
 * - Grouping by any field
 * - SQL-like filtering
 * - Bulk actions
 * - Color-coded runs
 * - Eye icon for visibility toggle
 */

import React, { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ColorDot, StatusBadge, CopyButton, getRunColor } from "./wandb-ui";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Columns,
  Trash2,
  Play,
  Square,
  GitCompare,
  Search,
  X,
  Check,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// Types
export interface Run {
  id: string;
  name: string;
  status: "running" | "completed" | "failed" | "stopped" | "pending";
  duration: string | null;
  createdAt: string;
  metrics: Record<string, number>;
  hyperparameters: Record<string, any>;
  tags?: string[];
  authorId?: string;
  modelId?: string;
}

interface Column {
  key: string;
  label: string;
  type: "text" | "number" | "status" | "date" | "metric" | "tag";
  sortable?: boolean;
  visible?: boolean;
  width?: string;
}

interface RunsTableProps {
  runs: Run[];
  onRunClick?: (run: Run) => void;
  onRunToggleVisibility?: (runId: string, visible: boolean) => void;
  onRunsDelete?: (runIds: string[]) => void;
  onRunsCompare?: (runIds: string[]) => void;
  onRunStop?: (runId: string) => void;
  visibleRunIds?: Set<string>;
  className?: string;
}

const DEFAULT_COLUMNS: Column[] = [
  { key: "name", label: "Run Name", type: "text", sortable: true, visible: true },
  { key: "status", label: "Status", type: "status", sortable: true, visible: true },
  { key: "duration", label: "Duration", type: "text", sortable: true, visible: true },
  { key: "createdAt", label: "Created", type: "date", sortable: true, visible: true },
  { key: "accuracy", label: "Accuracy", type: "metric", sortable: true, visible: true },
  { key: "loss", label: "Loss", type: "metric", sortable: true, visible: true },
  { key: "f1Score", label: "F1 Score", type: "metric", sortable: true, visible: false },
  { key: "learningRate", label: "Learning Rate", type: "metric", sortable: true, visible: false },
  { key: "batchSize", label: "Batch Size", type: "metric", sortable: true, visible: false },
  { key: "epochs", label: "Epochs", type: "metric", sortable: true, visible: false },
];

export function RunsTable({
  runs,
  onRunClick,
  onRunToggleVisibility,
  onRunsDelete,
  onRunsCompare,
  onRunStop,
  visibleRunIds,
  className,
}: RunsTableProps) {
  // State
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [selectedRuns, setSelectedRuns] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Visible columns
  const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);

  // Parse filter query (simple SQL-like syntax)
  const parseFilter = useCallback((query: string) => {
    if (!query.trim()) return null;

    // Support: accuracy > 0.9, loss < 0.1, status = completed
    const conditions: Array<{ field: string; operator: string; value: string }> = [];
    const parts = query.split(/\s+and\s+/i);

    for (const part of parts) {
      const match = part.match(/(\w+)\s*(>=|<=|!=|>|<|=)\s*(.+)/);
      if (match) {
        conditions.push({ field: match[1], operator: match[2], value: match[3].trim() });
      }
    }

    return conditions.length > 0 ? conditions : null;
  }, []);

  // Filter runs
  const filteredRuns = useMemo(() => {
    const conditions = parseFilter(filterQuery);
    if (!conditions) return runs;

    return runs.filter((run) => {
      return conditions.every(({ field, operator, value }) => {
        let runValue: any;

        // Check metrics first
        if (run.metrics && field in run.metrics) {
          runValue = run.metrics[field];
        } else if (run.hyperparameters && field in run.hyperparameters) {
          runValue = run.hyperparameters[field];
        } else if (field in run) {
          runValue = (run as any)[field];
        } else {
          return true; // Skip unknown fields
        }

        const numValue = parseFloat(value);
        const isNumeric = !isNaN(numValue);

        switch (operator) {
          case ">": return isNumeric && runValue > numValue;
          case "<": return isNumeric && runValue < numValue;
          case ">=": return isNumeric && runValue >= numValue;
          case "<=": return isNumeric && runValue <= numValue;
          case "=": return String(runValue).toLowerCase() === value.toLowerCase();
          case "!=": return String(runValue).toLowerCase() !== value.toLowerCase();
          default: return true;
        }
      });
    });
  }, [runs, filterQuery, parseFilter]);

  // Sort runs
  const sortedRuns = useMemo(() => {
    if (!sortConfig) return filteredRuns;

    return [...filteredRuns].sort((a, b) => {
      let aValue: any, bValue: any;

      if (a.metrics && sortConfig.key in a.metrics) {
        aValue = a.metrics[sortConfig.key];
        bValue = b.metrics[sortConfig.key];
      } else if (a.hyperparameters && sortConfig.key in a.hyperparameters) {
        aValue = a.hyperparameters[sortConfig.key];
        bValue = b.hyperparameters[sortConfig.key];
      } else {
        aValue = (a as any)[sortConfig.key];
        bValue = (b as any)[sortConfig.key];
      }

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredRuns, sortConfig]);

  // Group runs
  const groupedRuns = useMemo(() => {
    if (!groupBy) return { "": sortedRuns };

    const groups: Record<string, Run[]> = {};
    for (const run of sortedRuns) {
      let groupValue: string;

      if (run.hyperparameters && groupBy in run.hyperparameters) {
        groupValue = String(run.hyperparameters[groupBy]);
      } else if (groupBy in run) {
        groupValue = String((run as any)[groupBy]);
      } else {
        groupValue = "Other";
      }

      if (!groups[groupValue]) groups[groupValue] = [];
      groups[groupValue].push(run);
    }

    return groups;
  }, [sortedRuns, groupBy]);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return null;
      }
      return { key, direction: "asc" };
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRuns.size === sortedRuns.length) {
      setSelectedRuns(new Set());
    } else {
      setSelectedRuns(new Set(sortedRuns.map((r) => r.id)));
    }
  }, [sortedRuns, selectedRuns]);

  // Handle row select
  const handleRowSelect = useCallback((runId: string) => {
    setSelectedRuns((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
      }
      return next;
    });
  }, []);

  // Toggle group expansion
  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }, []);

  // Get metric value from run
  const getMetricValue = (run: Run, key: string): any => {
    if (run.metrics && key in run.metrics) return run.metrics[key];
    if (run.hyperparameters && key in run.hyperparameters) return run.hyperparameters[key];
    return (run as any)[key];
  };

  // Format cell value
  const formatValue = (value: any, type: Column["type"]): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;

    switch (type) {
      case "number":
      case "metric":
        if (typeof value === "number") {
          return value < 1 ? value.toFixed(4) : value.toFixed(2);
        }
        return value;
      case "date":
        return new Date(value).toLocaleDateString();
      case "status":
        return <StatusBadge status={value} size="sm" />;
      default:
        return String(value);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Search & Filter */}
        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter: accuracy > 0.9 and status = completed"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Group By */}
          <div className="relative">
            <select
              value={groupBy || ""}
              onChange={(e) => setGroupBy(e.target.value || null)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">No grouping</option>
              <option value="status">Group by Status</option>
              <option value="framework">Group by Framework</option>
              <option value="modelId">Group by Model</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
          </div>

          {/* Column Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className={cn(
                "p-2 border border-border rounded-md hover:bg-muted transition-colors",
                showColumnPicker && "bg-muted"
              )}
            >
              <Columns className="h-4 w-4" />
            </button>

            {showColumnPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColumnPicker(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-popover border border-border rounded-lg shadow-lg z-50">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Columns</div>
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => {
                          setColumns((prev) =>
                            prev.map((c) => (c.key === col.key ? { ...c, visible: !c.visible } : c))
                          );
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{col.label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedRuns.size > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md">
              <span className="text-sm font-medium text-primary">{selectedRuns.size} selected</span>
              <div className="w-px h-4 bg-border mx-1" />
              {onRunsCompare && (
                <button
                  onClick={() => onRunsCompare(Array.from(selectedRuns))}
                  className="p-1 hover:bg-primary/20 rounded"
                  title="Compare"
                >
                  <GitCompare className="h-4 w-4 text-primary" />
                </button>
              )}
              {onRunsDelete && (
                <button
                  onClick={() => {
                    onRunsDelete(Array.from(selectedRuns));
                    setSelectedRuns(new Set());
                  }}
                  className="p-1 hover:bg-red-500/20 rounded"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRuns.size === sortedRuns.length && sortedRuns.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="w-10 px-3 py-3" />
                <th className="w-8 px-3 py-3" />
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      col.sortable && "cursor-pointer hover:text-foreground"
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className="inline-flex">
                          {sortConfig?.key === col.key ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedRuns).map(([group, groupRuns]) => (
                <React.Fragment key={group}>
                  {/* Group Header */}
                  {groupBy && (
                    <tr
                      className="bg-muted/20 cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleGroup(group)}
                    >
                      <td colSpan={visibleColumns.length + 4} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {expandedGroups.has(group) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{group}</span>
                          <span className="text-muted-foreground text-sm">({groupRuns.length})</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Runs */}
                  {(!groupBy || expandedGroups.has(group)) &&
                    groupRuns.map((run, index) => {
                      const runColor = getRunColor(runs.findIndex((r) => r.id === run.id));
                      const isVisible = visibleRunIds ? visibleRunIds.has(run.id) : true;

                      return (
                        <tr
                          key={run.id}
                          className={cn(
                            "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                            selectedRuns.has(run.id) && "bg-primary/5"
                          )}
                          onClick={() => onRunClick?.(run)}
                        >
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRuns.has(run.id)}
                              onChange={() => handleRowSelect(run.id)}
                              className="rounded border-border"
                            />
                          </td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onRunToggleVisibility?.(run.id, !isVisible)}
                              className={cn(
                                "p-1 rounded hover:bg-muted transition-opacity",
                                !isVisible && "opacity-40"
                              )}
                              title={isVisible ? "Hide from charts" : "Show in charts"}
                            >
                              {isVisible ? (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <ColorDot color={runColor} size="md" pulse={run.status === "running"} />
                          </td>
                          {visibleColumns.map((col) => (
                            <td key={col.key} className="px-3 py-3 text-sm">
                              {col.key === "name" ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{run.name}</span>
                                  <CopyButton text={run.id} />
                                </div>
                              ) : (
                                formatValue(getMetricValue(run, col.key), col.type)
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 rounded hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              ))}

              {sortedRuns.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length + 4} className="px-3 py-8 text-center text-muted-foreground">
                    No runs match your filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {sortedRuns.length} of {runs.length} runs
        </span>
        <span className="text-xs">
          Tip: Use filters like <code className="px-1 py-0.5 bg-muted rounded">accuracy &gt; 0.9</code>
        </span>
      </div>
    </div>
  );
}

export default RunsTable;

