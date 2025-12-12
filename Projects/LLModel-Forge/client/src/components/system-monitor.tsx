/**
 * System Monitoring Dashboard - W&B Inspired
 *
 * Features:
 * - Real-time CPU, GPU, Memory usage
 * - Sparkline mini-charts
 * - Live terminal logs
 * - Alert indicators
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Sparkline, ResourceUsage } from "./wandb-ui";
import {
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  Terminal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  X,
  RefreshCw,
} from "lucide-react";

// Simulated system metrics (in real app, would come from WebSocket)
interface SystemMetrics {
  cpu: number;
  memory: number;
  gpu: number;
  gpuMemory: number;
  networkIn: number;
  networkOut: number;
  diskRead: number;
  diskWrite: number;
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warning" | "error" | "debug";
  message: string;
}

interface SystemMonitorProps {
  runId?: string;
  isLive?: boolean;
  className?: string;
}

export function SystemMonitor({ runId, isLive = true, className }: SystemMonitorProps) {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    gpu: 78,
    gpuMemory: 84,
    networkIn: 125,
    networkOut: 45,
    diskRead: 32,
    diskWrite: 18,
  });

  const [history, setHistory] = useState<{
    cpu: number[];
    memory: number[];
    gpu: number[];
    gpuMemory: number[];
  }>({
    cpu: Array(30).fill(0).map(() => Math.random() * 50 + 30),
    memory: Array(30).fill(0).map(() => Math.random() * 20 + 55),
    gpu: Array(30).fill(0).map(() => Math.random() * 30 + 60),
    gpuMemory: Array(30).fill(0).map(() => Math.random() * 20 + 70),
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "10:45:23", level: "info", message: "Starting epoch 15/100..." },
    { timestamp: "10:45:24", level: "info", message: "Train loss: 0.0234, accuracy: 0.9567" },
    { timestamp: "10:45:25", level: "debug", message: "Gradient norm: 1.234" },
    { timestamp: "10:45:26", level: "info", message: "Validation started..." },
    { timestamp: "10:45:28", level: "info", message: "Val loss: 0.0456, accuracy: 0.9412" },
    { timestamp: "10:45:29", level: "warning", message: "GPU memory usage > 80%" },
    { timestamp: "10:45:30", level: "info", message: "Checkpoint saved: epoch_15.pt" },
  ]);

  const [showLogs, setShowLogs] = useState(true);
  const [logsExpanded, setLogsExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Simulate metric updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics((prev) => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() - 0.5) * 5)),
        gpu: Math.min(100, Math.max(0, prev.gpu + (Math.random() - 0.5) * 15)),
        gpuMemory: Math.min(100, Math.max(0, prev.gpuMemory + (Math.random() - 0.5) * 8)),
        networkIn: Math.max(0, prev.networkIn + (Math.random() - 0.5) * 50),
        networkOut: Math.max(0, prev.networkOut + (Math.random() - 0.5) * 30),
        diskRead: Math.max(0, prev.diskRead + (Math.random() - 0.5) * 20),
        diskWrite: Math.max(0, prev.diskWrite + (Math.random() - 0.5) * 15),
      }));

      setHistory((prev) => ({
        cpu: [...prev.cpu.slice(1), metrics.cpu],
        memory: [...prev.memory.slice(1), metrics.memory],
        gpu: [...prev.gpu.slice(1), metrics.gpu],
        gpuMemory: [...prev.gpuMemory.slice(1), metrics.gpuMemory],
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, metrics]);

  // Simulate log updates
  useEffect(() => {
    if (!isLive) return;

    const logMessages = [
      { level: "info" as const, message: "Processing batch..." },
      { level: "debug" as const, message: "Forward pass complete" },
      { level: "info" as const, message: "Backward pass complete" },
      { level: "info" as const, message: "Optimizer step complete" },
      { level: "warning" as const, message: "Learning rate: 0.0001" },
    ];

    const interval = setInterval(() => {
      const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
      const now = new Date();
      const timestamp = now.toTimeString().slice(0, 8);

      setLogs((prev) => [...prev.slice(-100), { ...randomLog, timestamp }]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} GB/s`;
    return `${bytes.toFixed(0)} MB/s`;
  };

  // Check for warnings
  const hasWarnings = metrics.gpuMemory > 90 || metrics.memory > 90 || metrics.cpu > 95;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">System Resources</h3>
          {isLive && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live
            </span>
          )}
        </div>
        {hasWarnings && (
          <div className="flex items-center gap-1 text-yellow-500 text-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>High resource usage</span>
          </div>
        )}
      </div>

      {/* Resource Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">CPU</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              metrics.cpu > 90 ? "text-red-500" : metrics.cpu > 70 ? "text-yellow-500" : "text-foreground"
            )}>
              {metrics.cpu.toFixed(0)}%
            </span>
          </div>
          <Sparkline
            data={history.cpu}
            color={metrics.cpu > 90 ? "#ef4444" : "#3b82f6"}
            height={32}
            className="w-full"
          />
        </div>

        {/* Memory */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              metrics.memory > 90 ? "text-red-500" : metrics.memory > 70 ? "text-yellow-500" : "text-foreground"
            )}>
              {metrics.memory.toFixed(0)}%
            </span>
          </div>
          <Sparkline
            data={history.memory}
            color={metrics.memory > 90 ? "#ef4444" : "#a855f7"}
            height={32}
            className="w-full"
          />
        </div>

        {/* GPU */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">GPU</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              metrics.gpu > 90 ? "text-red-500" : metrics.gpu > 70 ? "text-yellow-500" : "text-foreground"
            )}>
              {metrics.gpu.toFixed(0)}%
            </span>
          </div>
          <Sparkline
            data={history.gpu}
            color={metrics.gpu > 90 ? "#ef4444" : "#22c55e"}
            height={32}
            className="w-full"
          />
        </div>

        {/* GPU Memory */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">GPU Mem</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              metrics.gpuMemory > 90 ? "text-red-500" : metrics.gpuMemory > 70 ? "text-yellow-500" : "text-foreground"
            )}>
              {metrics.gpuMemory.toFixed(0)}%
            </span>
          </div>
          <Sparkline
            data={history.gpuMemory}
            color={metrics.gpuMemory > 90 ? "#ef4444" : "#f97316"}
            height={32}
            className="w-full"
          />
        </div>
      </div>

      {/* Network & Disk */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
          <Download className="h-4 w-4 text-cyan-500" />
          <div>
            <div className="text-xs text-muted-foreground">Network In</div>
            <div className="font-medium">{formatBytes(metrics.networkIn)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
          <Upload className="h-4 w-4 text-pink-500" />
          <div>
            <div className="text-xs text-muted-foreground">Network Out</div>
            <div className="font-medium">{formatBytes(metrics.networkOut)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
          <HardDrive className="h-4 w-4 text-indigo-500" />
          <div>
            <div className="text-xs text-muted-foreground">Disk Read</div>
            <div className="font-medium">{formatBytes(metrics.diskRead)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
          <HardDrive className="h-4 w-4 text-amber-500" />
          <div>
            <div className="text-xs text-muted-foreground">Disk Write</div>
            <div className="font-medium">{formatBytes(metrics.diskWrite)}</div>
          </div>
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div
          className="flex items-center justify-between px-4 py-2 border-b border-border cursor-pointer hover:bg-muted/50"
          onClick={() => setShowLogs(!showLogs)}
        >
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Console Output</span>
            <span className="text-xs text-muted-foreground">({logs.length} lines)</span>
          </div>
          <div className="flex items-center gap-2">
            {showLogs && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLogsExpanded(!logsExpanded);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                {logsExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
            {showLogs ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        {showLogs && (
          <div
            className={cn(
              "font-mono text-xs overflow-auto bg-black/90 p-4",
              logsExpanded ? "h-96" : "h-48"
            )}
          >
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2 hover:bg-white/5 py-0.5">
                <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                <span className={cn(
                  "shrink-0 w-14",
                  log.level === "error" && "text-red-400",
                  log.level === "warning" && "text-yellow-400",
                  log.level === "info" && "text-blue-400",
                  log.level === "debug" && "text-gray-400"
                )}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-gray-200">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

// Compact sidebar version
export function SystemMonitorSidebar({ className }: { className?: string }) {
  const [metrics] = useState({
    cpu: 45,
    memory: 62,
    gpu: 78,
    gpuMemory: 84,
  });

  return (
    <div className={cn("space-y-3 p-3 rounded-lg border border-border bg-card", className)}>
      <div className="text-xs font-medium text-muted-foreground">Resources</div>
      <ResourceUsage label="CPU" value={metrics.cpu} />
      <ResourceUsage label="Memory" value={metrics.memory} />
      <ResourceUsage label="GPU" value={metrics.gpu} />
      <ResourceUsage label="GPU Mem" value={metrics.gpuMemory} />
    </div>
  );
}

export default SystemMonitor;

