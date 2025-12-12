/**
 * W&B Inspired UI Components for LLModel-Forge
 *
 * Key improvements:
 * - Color-coded runs with unique identifiers
 * - Interactive charts with smoothing
 * - Parallel coordinates for hyperparameter visualization
 * - Synchronized tooltips across charts
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Brush,
} from "recharts";
import { cn } from "@/lib/utils";

// Generate consistent colors for runs
const RUN_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f97316", // Orange
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#84cc16", // Lime
];

export function getRunColor(index: number): string {
  return RUN_COLORS[index % RUN_COLORS.length];
}

// Color dot for run identification
interface ColorDotProps {
  color: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function ColorDot({ color, size = "md", pulse = false }: ColorDotProps) {
  const sizes = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <span className="relative inline-flex">
      {pulse && (
        <span
          className={cn("animate-ping absolute inline-flex rounded-full opacity-75", sizes[size])}
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full", sizes[size])}
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

// Smoothing slider for charts
interface SmoothingSliderProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function SmoothingSlider({ value, onChange, className }: SmoothingSliderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-xs text-muted-foreground whitespace-nowrap">Smoothing</span>
      <input
        type="range"
        min="0"
        max="0.99"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-24 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <span className="text-xs text-muted-foreground w-8">{Math.round(value * 100)}%</span>
    </div>
  );
}

// Apply exponential moving average smoothing
export function smoothData(data: number[], factor: number): number[] {
  if (factor === 0) return data;

  const smoothed: number[] = [];
  let lastSmoothed = data[0];

  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const smoothedValue = factor * lastSmoothed + (1 - factor) * current;
    smoothed.push(smoothedValue);
    lastSmoothed = smoothedValue;
  }

  return smoothed;
}

// Advanced metric chart with smoothing and zoom
interface MetricChartProps {
  data: any[];
  lines: Array<{
    key: string;
    name: string;
    color: string;
    dashed?: boolean;
  }>;
  xKey?: string;
  height?: number;
  showBrush?: boolean;
  syncId?: string;
  smoothing?: number;
  logScale?: boolean;
}

export function MetricChart({
  data,
  lines,
  xKey = "step",
  height = 300,
  showBrush = false,
  syncId,
  smoothing = 0,
  logScale = false,
}: MetricChartProps) {
  // Apply smoothing to data
  const smoothedData = useMemo(() => {
    if (smoothing === 0) return data;

    return data.map((point, idx) => {
      const smoothedPoint = { ...point };
      lines.forEach(line => {
        const values = data.map(d => d[line.key] as number);
        const smoothedValues = smoothData(values, smoothing);
        smoothedPoint[line.key] = smoothedValues[idx];
      });
      return smoothedPoint;
    });
  }, [data, lines, smoothing]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={smoothedData} syncId={syncId}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey={xKey}
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          scale={logScale ? "log" : "auto"}
          domain={logScale ? ["auto", "auto"] : undefined}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            if (value < 1 && value > 0) return value.toFixed(3);
            return value.toFixed(1);
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--popover-foreground))",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={8}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            strokeDasharray={line.dashed ? "5 5" : undefined}
            dot={false}
            activeDot={{ r: 4, fill: line.color }}
          />
        ))}
        {showBrush && (
          <Brush
            dataKey={xKey}
            height={30}
            stroke="hsl(var(--primary))"
            fill="hsl(var(--muted))"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Run visibility toggle (eye icon)
interface RunVisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
  color: string;
  name: string;
}

export function RunVisibilityToggle({ visible, onToggle, color, name }: RunVisibilityToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded text-sm transition-all",
        visible ? "opacity-100" : "opacity-40"
      )}
    >
      <ColorDot color={color} size="sm" />
      <span className="truncate max-w-[150px]">{name}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-opacity", visible ? "opacity-100" : "opacity-30")}
      >
        {visible ? (
          <>
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </>
        ) : (
          <>
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </>
        )}
      </svg>
    </button>
  );
}

// Sparkline mini chart for sidebar
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  showArea?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  color = "hsl(var(--primary))",
  width = 80,
  height = 24,
  showArea = true,
  className,
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} className={className}>
      {showArea && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.1}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Status badge with color coding
interface StatusBadgeProps {
  status: "running" | "completed" | "failed" | "stopped" | "pending";
  size?: "sm" | "md";
  showPulse?: boolean;
}

export function StatusBadge({ status, size = "md", showPulse = true }: StatusBadgeProps) {
  const config = {
    running: { color: "bg-blue-500", text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    completed: { color: "bg-green-500", text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    failed: { color: "bg-red-500", text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    stopped: { color: "bg-yellow-500", text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    pending: { color: "bg-gray-500", text: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" },
  };

  const { color, text, bg, border } = config[status];
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-medium border", bg, text, border, sizeClass)}>
      {status === "running" && showPulse ? (
        <span className="relative flex h-2 w-2">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", color)} />
          <span className={cn("relative inline-flex rounded-full h-2 w-2", color)} />
        </span>
      ) : (
        <span className={cn("h-2 w-2 rounded-full", color)} />
      )}
      <span className="capitalize">{status}</span>
    </span>
  );
}

// Metric delta indicator
interface MetricDeltaProps {
  value: number;
  suffix?: string;
  inverse?: boolean; // true if lower is better (e.g., loss)
}

export function MetricDelta({ value, suffix = "%", inverse = false }: MetricDeltaProps) {
  const isPositive = inverse ? value < 0 : value > 0;
  const absValue = Math.abs(value);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        isPositive ? "text-green-500" : value === 0 ? "text-muted-foreground" : "text-red-500"
      )}
    >
      {value !== 0 && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={value < 0 ? "rotate-180" : ""}
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      )}
      {absValue.toFixed(1)}{suffix}
    </span>
  );
}

// Keyboard shortcut hint
interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-mono font-medium",
        "bg-muted border border-border rounded shadow-sm",
        "min-w-[20px]",
        className
      )}
    >
      {children}
    </kbd>
  );
}

// Copy button
interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1 rounded hover:bg-muted transition-colors",
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      )}
    </button>
  );
}

// Resource usage indicator
interface ResourceUsageProps {
  label: string;
  value: number; // 0-100
  unit?: string;
  showWarning?: boolean;
}

export function ResourceUsage({ label, value, unit = "%", showWarning = true }: ResourceUsageProps) {
  const isWarning = showWarning && value > 90;
  const isCaution = showWarning && value > 75 && value <= 90;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          isWarning && "text-red-500",
          isCaution && "text-yellow-500"
        )}>
          {value.toFixed(0)}{unit}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isWarning ? "bg-red-500" : isCaution ? "bg-yellow-500" : "bg-primary"
          )}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export default {
  ColorDot,
  SmoothingSlider,
  MetricChart,
  RunVisibilityToggle,
  Sparkline,
  StatusBadge,
  MetricDelta,
  Kbd,
  CopyButton,
  ResourceUsage,
  getRunColor,
  smoothData,
};

