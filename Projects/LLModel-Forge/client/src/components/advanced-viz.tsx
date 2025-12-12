/**
 * Advanced Visualization Components
 *
 * Features:
 * - Scatter Plot with clustering
 * - Heatmap for confusion matrices
 * - 3D visualization support
 * - Physics-based animations
 * - Real-time updates
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { getRunColor, ColorDot } from "./wandb-ui";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Crosshair,
  TrendingUp,
} from "lucide-react";
import { Statistics, Metrics } from "@/lib/ml-math";

// ==================== SCATTER PLOT ====================

interface ScatterDataPoint {
  id: string;
  x: number;
  y: number;
  z?: number;
  category?: string;
  label?: string;
  size?: number;
  metadata?: Record<string, any>;
}

interface AdvancedScatterPlotProps {
  data: ScatterDataPoint[];
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  showRegression?: boolean;
  showClusters?: boolean;
  onPointClick?: (point: ScatterDataPoint) => void;
  selectedPointId?: string;
  height?: number;
  className?: string;
}

export function AdvancedScatterPlot({
  data,
  xLabel = "X",
  yLabel = "Y",
  zLabel,
  showRegression = false,
  showClusters = false,
  onPointClick,
  selectedPointId,
  height = 400,
  className,
}: AdvancedScatterPlotProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ScatterDataPoint | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [logScaleX, setLogScaleX] = useState(false);
  const [logScaleY, setLogScaleY] = useState(false);

  // Group by category
  const categories = useMemo(() => {
    const cats = new Map<string, ScatterDataPoint[]>();
    data.forEach(point => {
      const cat = point.category || "default";
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(point);
    });
    return Array.from(cats.entries());
  }, [data]);

  // Linear regression
  const regression = useMemo(() => {
    if (!showRegression || data.length < 2) return null;

    const xVals = data.map(d => d.x);
    const yVals = data.map(d => d.y);
    const n = data.length;

    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((acc, x, i) => acc + x * yVals[i], 0);
    const sumX2 = xVals.reduce((acc, x) => acc + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const meanY = sumY / n;
    const ssTotal = yVals.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0);
    const ssResidual = yVals.reduce((acc, y, i) => acc + Math.pow(y - (slope * xVals[i] + intercept), 2), 0);
    const r2 = 1 - ssResidual / ssTotal;

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);

    return {
      slope,
      intercept,
      r2,
      points: [
        { x: minX, y: slope * minX + intercept },
        { x: maxX, y: slope * maxX + intercept },
      ],
    };
  }, [data, showRegression]);

  // Correlation
  const correlation = useMemo(() => {
    if (data.length < 2) return 0;
    return Statistics.correlation(data.map(d => d.x), data.map(d => d.y));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload as ScatterDataPoint;

    return (
      <div className="p-3 bg-popover border border-border rounded-lg shadow-lg">
        <div className="font-medium mb-2">{point.label || point.id}</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{xLabel}:</span>
            <span className="font-mono">{point.x.toFixed(4)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">{yLabel}:</span>
            <span className="font-mono">{point.y.toFixed(4)}</span>
          </div>
          {point.z !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{zLabel || "Z"}:</span>
              <span className="font-mono">{point.z.toFixed(4)}</span>
            </div>
          )}
          {point.category && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Category:</span>
              <span>{point.category}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Correlation:</span>
            <span className={cn(
              "font-mono font-medium",
              correlation > 0.7 ? "text-green-500" :
              correlation < -0.7 ? "text-red-500" : "text-yellow-500"
            )}>
              {correlation.toFixed(3)}
            </span>
          </div>
          {regression && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">R²:</span>
              <span className="font-mono">{regression.r2.toFixed(4)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Points:</span>
            <span>{data.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              "p-1.5 rounded hover:bg-muted",
              showGrid && "bg-muted"
            )}
            title="Toggle grid"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLogScaleX(!logScaleX)}
            className={cn(
              "p-1.5 rounded hover:bg-muted text-xs font-mono",
              logScaleX && "bg-muted"
            )}
            title="Toggle X log scale"
          >
            logX
          </button>
          <button
            onClick={() => setLogScaleY(!logScaleY)}
            className={cn(
              "p-1.5 rounded hover:bg-muted text-xs font-mono",
              logScaleY && "bg-muted"
            )}
            title="Toggle Y log scale"
          >
            logY
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          )}
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            scale={logScaleX ? "log" : "auto"}
            domain={logScaleX ? ["auto", "auto"] : undefined}
            label={{ value: xLabel, position: "bottom", offset: 0 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            scale={logScaleY ? "log" : "auto"}
            domain={logScaleY ? ["auto", "auto"] : undefined}
            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
          />
          {data[0]?.z !== undefined && (
            <ZAxis
              type="number"
              dataKey="z"
              range={[50, 400]}
              name={zLabel || "Size"}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Data points by category */}
          {categories.map(([category, points], catIndex) => (
            <Scatter
              key={category}
              name={category}
              data={points}
              fill={getRunColor(catIndex)}
              onClick={(e: any) => onPointClick?.(e.payload)}
            >
              {points.map((point, i) => (
                <Cell
                  key={i}
                  fill={getRunColor(catIndex)}
                  opacity={selectedPointId === point.id ? 1 : 0.7}
                  stroke={selectedPointId === point.id ? "#fff" : "none"}
                  strokeWidth={selectedPointId === point.id ? 2 : 0}
                />
              ))}
            </Scatter>
          ))}

          {/* Regression line */}
          {regression && regression.points.length === 2 && (
            <ReferenceLine
              segment={regression.points}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `y = ${regression.slope.toFixed(3)}x + ${regression.intercept.toFixed(3)}`,
                position: "insideTopRight",
              }}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==================== HEATMAP / CONFUSION MATRIX ====================

interface HeatmapProps {
  data: number[][];
  xLabels?: string[];
  yLabels?: string[];
  title?: string;
  showValues?: boolean;
  colorScale?: "blue" | "red" | "green" | "viridis" | "plasma";
  normalized?: boolean;
  height?: number;
  className?: string;
}

export function Heatmap({
  data,
  xLabels,
  yLabels,
  title,
  showValues = true,
  colorScale = "viridis",
  normalized = false,
  height = 400,
  className,
}: HeatmapProps) {
  // Normalize if needed
  const displayData = useMemo(() => {
    if (!normalized) return data;
    const max = Math.max(...data.flat());
    const min = Math.min(...data.flat());
    const range = max - min || 1;
    return data.map(row => row.map(val => (val - min) / range));
  }, [data, normalized]);

  // Color scales
  const getColor = (value: number) => {
    const v = normalized ? value : value / Math.max(...data.flat());

    switch (colorScale) {
      case "blue":
        return `rgba(59, 130, 246, ${0.1 + v * 0.9})`;
      case "red":
        return `rgba(239, 68, 68, ${0.1 + v * 0.9})`;
      case "green":
        return `rgba(34, 197, 94, ${0.1 + v * 0.9})`;
      case "viridis":
        // Viridis-like gradient
        const r = Math.round(68 + v * 187);
        const g = Math.round(1 + v * 150);
        const b = Math.round(84 + v * 90);
        return `rgb(${r}, ${g}, ${b})`;
      case "plasma":
        // Plasma-like gradient
        return `hsl(${280 - v * 200}, 80%, ${30 + v * 40}%)`;
      default:
        return `rgba(99, 102, 241, ${0.1 + v * 0.9})`;
    }
  };

  const rows = data.length;
  const cols = data[0]?.length || 0;
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;

  return (
    <div className={cn("space-y-3", className)}>
      {title && <h4 className="font-medium text-center">{title}</h4>}

      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around pr-2 text-xs text-muted-foreground">
          {(yLabels || data.map((_, i) => String(i))).map((label, i) => (
            <span key={i} className="text-right w-16 truncate">{label}</span>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="ml-20 h-full">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {displayData.map((row, i) =>
              row.map((value, j) => (
                <g key={`${i}-${j}`}>
                  <rect
                    x={j * cellWidth}
                    y={i * cellHeight}
                    width={cellWidth}
                    height={cellHeight}
                    fill={getColor(value)}
                    stroke="hsl(var(--background))"
                    strokeWidth={0.2}
                  />
                  {showValues && (
                    <text
                      x={j * cellWidth + cellWidth / 2}
                      y={i * cellHeight + cellHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[3px] fill-white font-medium"
                      style={{ textShadow: "0 0 2px rgba(0,0,0,0.5)" }}
                    >
                      {data[i][j].toFixed(normalized ? 2 : 0)}
                    </text>
                  )}
                </g>
              ))
            )}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-around mt-2 text-xs text-muted-foreground">
            {(xLabels || (data[0] || []).map((_, i) => String(i))).map((label, i) => (
              <span key={i} className="text-center truncate" style={{ width: `${cellWidth}%` }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Color scale legend */}
        <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col">
          <div
            className="flex-1 rounded"
            style={{
              background: colorScale === "viridis"
                ? "linear-gradient(to top, rgb(68, 1, 84), rgb(59, 82, 139), rgb(33, 145, 140), rgb(94, 201, 98), rgb(253, 231, 37))"
                : colorScale === "plasma"
                ? "linear-gradient(to top, hsl(280, 80%, 30%), hsl(180, 80%, 50%), hsl(80, 80%, 70%))"
                : `linear-gradient(to top, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 1))`,
            }}
          />
          <div className="flex flex-col justify-between text-[10px] text-muted-foreground mt-1">
            <span>{Math.max(...data.flat()).toFixed(0)}</span>
            <span>{Math.min(...data.flat()).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== REAL-TIME METRIC STREAM ====================

interface MetricStreamData {
  timestamp: number;
  value: number;
}

interface RealTimeMetricStreamProps {
  data: MetricStreamData[];
  label: string;
  unit?: string;
  maxPoints?: number;
  height?: number;
  color?: string;
  threshold?: { value: number; type: "above" | "below"; color: string };
  className?: string;
}

export function RealTimeMetricStream({
  data,
  label,
  unit = "",
  maxPoints = 100,
  height = 120,
  color = "hsl(var(--primary))",
  threshold,
  className,
}: RealTimeMetricStreamProps) {
  const displayData = data.slice(-maxPoints);

  // Calculate stats
  const values = displayData.map(d => d.value);
  const current = values[values.length - 1] ?? 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Statistics.mean(values);
  const std = Statistics.std(values);

  // Check threshold
  const isAlerting = threshold && (
    (threshold.type === "above" && current > threshold.value) ||
    (threshold.type === "below" && current < threshold.value)
  );

  // Generate path
  const generatePath = () => {
    if (displayData.length === 0) return "";

    const range = max - min || 1;
    const padding = 10;
    const chartHeight = height - padding * 2;
    const stepX = 100 / (displayData.length - 1);

    const points = displayData.map((d, i) => {
      const x = i * stepX;
      const y = padding + (1 - (d.value - min) / range) * chartHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  // Generate area path
  const generateAreaPath = () => {
    const linePath = generatePath();
    if (!linePath) return "";
    return `${linePath} L 100,${height} L 0,${height} Z`;
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {isAlerting && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        <span className={cn(
          "text-xl font-bold font-mono",
          isAlerting && "text-red-500"
        )}>
          {current.toFixed(2)}{unit}
        </span>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
        {/* Area fill */}
        <path
          d={generateAreaPath()}
          fill={color}
          fillOpacity={0.1}
        />

        {/* Line */}
        <path
          d={generatePath()}
          fill="none"
          stroke={isAlerting ? "#ef4444" : color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Threshold line */}
        {threshold && (
          <line
            x1={0}
            y1={10 + (1 - (threshold.value - min) / (max - min || 1)) * (height - 20)}
            x2={100}
            y2={10 + (1 - (threshold.value - min) / (max - min || 1)) * (height - 20)}
            stroke={threshold.color}
            strokeWidth={1}
            strokeDasharray="4 2"
            opacity={0.7}
          />
        )}

        {/* Current value dot */}
        {displayData.length > 0 && (
          <circle
            cx={100}
            cy={10 + (1 - (current - min) / (max - min || 1)) * (height - 20)}
            r={4}
            fill={isAlerting ? "#ef4444" : color}
            stroke="white"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Stats */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>min: {min.toFixed(2)}</span>
        <span>avg: {avg.toFixed(2)}</span>
        <span>max: {max.toFixed(2)}</span>
        <span>σ: {std.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ==================== PHYSICS SIMULATION VISUALIZATION ====================

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  charge?: number;
  label?: string;
}

interface PhysicsVisualizationProps {
  particles: Particle[];
  width?: number;
  height?: number;
  gravity?: number;
  friction?: number;
  running?: boolean;
  onUpdate?: (particles: Particle[]) => void;
  className?: string;
}

export function PhysicsVisualization({
  particles: initialParticles,
  width = 600,
  height = 400,
  gravity = 0.1,
  friction = 0.99,
  running = true,
  onUpdate,
  className,
}: PhysicsVisualizationProps) {
  const [particles, setParticles] = useState(initialParticles);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const simulate = () => {
      setParticles(prevParticles => {
        const newParticles = prevParticles.map(p => {
          let { x, y, vx, vy } = p;

          // Apply gravity
          vy += gravity;

          // Apply friction
          vx *= friction;
          vy *= friction;

          // Update position
          x += vx;
          y += vy;

          // Boundary collision
          if (x < 0 || x > width) {
            vx = -vx * 0.8;
            x = Math.max(0, Math.min(width, x));
          }
          if (y < 0 || y > height) {
            vy = -vy * 0.8;
            y = Math.max(0, Math.min(height, y));
          }

          return { ...p, x, y, vx, vy };
        });

        // Particle-particle collision (simple)
        for (let i = 0; i < newParticles.length; i++) {
          for (let j = i + 1; j < newParticles.length; j++) {
            const p1 = newParticles[i];
            const p2 = newParticles[j];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 20;

            if (dist < minDist && dist > 0) {
              const nx = dx / dist;
              const ny = dy / dist;
              const relVx = p1.vx - p2.vx;
              const relVy = p1.vy - p2.vy;
              const relVn = relVx * nx + relVy * ny;

              if (relVn > 0) {
                const impulse = (2 * relVn) / (p1.mass + p2.mass);
                p1.vx -= impulse * p2.mass * nx;
                p1.vy -= impulse * p2.mass * ny;
                p2.vx += impulse * p1.mass * nx;
                p2.vy += impulse * p1.mass * ny;
              }

              // Separate particles
              const overlap = (minDist - dist) / 2;
              p1.x -= overlap * nx;
              p1.y -= overlap * ny;
              p2.x += overlap * nx;
              p2.y += overlap * ny;
            }
          }
        }

        onUpdate?.(newParticles);
        return newParticles;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [running, width, height, gravity, friction, onUpdate]);

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-black/20", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        {/* Particles */}
        {particles.map((p, i) => (
          <g key={p.id}>
            {/* Velocity vector */}
            <line
              x1={p.x}
              y1={p.y}
              x2={p.x + p.vx * 5}
              y2={p.y + p.vy * 5}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1}
            />
            {/* Particle */}
            <circle
              cx={p.x}
              cy={p.y}
              r={Math.sqrt(p.mass) * 3}
              fill={getRunColor(i)}
              stroke="white"
              strokeWidth={1}
              opacity={0.8}
            />
            {/* Label */}
            {p.label && (
              <text
                x={p.x}
                y={p.y - Math.sqrt(p.mass) * 3 - 5}
                textAnchor="middle"
                className="text-[10px] fill-white"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default {
  AdvancedScatterPlot,
  Heatmap,
  RealTimeMetricStream,
  PhysicsVisualization,
};

