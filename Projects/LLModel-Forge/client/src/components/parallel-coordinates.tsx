/**
 * Parallel Coordinates Chart - W&B Inspired
 *
 * Perfect for hyperparameter tuning visualization.
 * Shows relationships between multiple parameters and outcomes.
 */

import React, { useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getRunColor, ColorDot } from "./wandb-ui";

interface ParallelCoordinatesProps {
  data: Array<{
    id: string;
    name: string;
    values: Record<string, number>;
    highlighted?: boolean;
  }>;
  axes: Array<{
    key: string;
    label: string;
    domain?: [number, number];
    format?: (value: number) => string;
  }>;
  height?: number;
  highlightedId?: string | null;
  onLineClick?: (id: string) => void;
  onLineHover?: (id: string | null) => void;
  className?: string;
}

export function ParallelCoordinates({
  data,
  axes,
  height = 300,
  highlightedId,
  onLineClick,
  onLineHover,
  className,
}: ParallelCoordinatesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Calculate axis positions and scales
  const { axisPositions, scales, padding } = useMemo(() => {
    const padding = { top: 30, right: 40, bottom: 30, left: 40 };
    const chartWidth = 800; // Will be scaled by viewBox
    const chartHeight = height - padding.top - padding.bottom;

    const axisPositions = axes.map((_, i) => ({
      x: padding.left + (i * (chartWidth - padding.left - padding.right)) / (axes.length - 1),
    }));

    const scales = axes.map((axis) => {
      const values = data.map((d) => d.values[axis.key]).filter((v) => v !== undefined);
      const min = axis.domain?.[0] ?? Math.min(...values);
      const max = axis.domain?.[1] ?? Math.max(...values);
      const range = max - min || 1;

      return {
        min,
        max,
        scale: (value: number) => {
          const normalized = (value - min) / range;
          return padding.top + (1 - normalized) * chartHeight;
        },
        inverse: (y: number) => {
          const normalized = 1 - (y - padding.top) / chartHeight;
          return min + normalized * range;
        },
      };
    });

    return { axisPositions, scales, padding };
  }, [axes, data, height]);

  // Generate path for each data point
  const paths = useMemo(() => {
    return data.map((item, dataIndex) => {
      const points = axes.map((axis, axisIndex) => {
        const value = item.values[axis.key];
        if (value === undefined) return null;
        return {
          x: axisPositions[axisIndex].x,
          y: scales[axisIndex].scale(value),
        };
      }).filter(Boolean) as Array<{ x: number; y: number }>;

      if (points.length < 2) return null;

      const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      const color = getRunColor(dataIndex);

      return {
        id: item.id,
        name: item.name,
        path: pathD,
        color,
        highlighted: item.highlighted || item.id === highlightedId || item.id === hoveredId,
      };
    }).filter(Boolean);
  }, [data, axes, axisPositions, scales, highlightedId, hoveredId]);

  const handleMouseEnter = useCallback((id: string) => {
    setHoveredId(id);
    onLineHover?.(id);
  }, [onLineHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null);
    onLineHover?.(null);
  }, [onLineHover]);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 800 ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width="100%" height="100%" fill="transparent" />

        {/* Axes */}
        {axes.map((axis, i) => {
          const x = axisPositions[i].x;
          const scale = scales[i];
          const tickCount = 5;
          const ticks = Array.from({ length: tickCount }, (_, j) => {
            const value = scale.min + (scale.max - scale.min) * (j / (tickCount - 1));
            return { value, y: scale.scale(value) };
          });

          return (
            <g key={axis.key}>
              {/* Axis line */}
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={height - padding.bottom}
                stroke="hsl(var(--border))"
                strokeWidth={1}
              />

              {/* Axis label */}
              <text
                x={x}
                y={padding.top - 10}
                textAnchor="middle"
                className="text-xs fill-muted-foreground font-medium"
              >
                {axis.label}
              </text>

              {/* Ticks */}
              {ticks.map(({ value, y }, j) => (
                <g key={j}>
                  <line
                    x1={x - 4}
                    y1={y}
                    x2={x + 4}
                    y2={y}
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                  />
                  <text
                    x={x - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="text-[10px] fill-muted-foreground"
                  >
                    {axis.format ? axis.format(value) : value.toFixed(value < 1 ? 3 : 1)}
                  </text>
                </g>
              ))}
            </g>
          );
        })}

        {/* Lines (non-highlighted first) */}
        {paths.map((p) => p && !p.highlighted && (
          <path
            key={p.id}
            d={p.path}
            fill="none"
            stroke={p.color}
            strokeWidth={1.5}
            strokeOpacity={0.3}
            className="cursor-pointer transition-opacity"
            onMouseEnter={() => handleMouseEnter(p.id)}
            onMouseLeave={handleMouseLeave}
            onClick={() => onLineClick?.(p.id)}
          />
        ))}

        {/* Highlighted lines (on top) */}
        {paths.map((p) => p && p.highlighted && (
          <path
            key={`${p.id}-highlighted`}
            d={p.path}
            fill="none"
            stroke={p.color}
            strokeWidth={3}
            strokeOpacity={1}
            className="cursor-pointer"
            onMouseEnter={() => handleMouseEnter(p.id)}
            onMouseLeave={handleMouseLeave}
            onClick={() => onLineClick?.(p.id)}
          />
        ))}

        {/* Points on highlighted lines */}
        {hoveredId && (() => {
          const item = data.find((d) => d.id === hoveredId);
          if (!item) return null;

          return axes.map((axis, i) => {
            const value = item.values[axis.key];
            if (value === undefined) return null;
            const x = axisPositions[i].x;
            const y = scales[i].scale(value);
            const color = getRunColor(data.findIndex((d) => d.id === hoveredId));

            return (
              <g key={axis.key}>
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill={color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
                <text
                  x={x + 10}
                  y={y}
                  dominantBaseline="middle"
                  className="text-xs fill-foreground font-medium"
                >
                  {axis.format ? axis.format(value) : value.toFixed(3)}
                </text>
              </g>
            );
          });
        })()}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.slice(0, 10).map((item, i) => (
          <button
            key={item.id}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all",
              hoveredId === item.id || highlightedId === item.id
                ? "bg-muted ring-1 ring-primary/50"
                : "hover:bg-muted/50"
            )}
            onMouseEnter={() => handleMouseEnter(item.id)}
            onMouseLeave={handleMouseLeave}
            onClick={() => onLineClick?.(item.id)}
          >
            <ColorDot color={getRunColor(i)} size="sm" />
            <span className="truncate max-w-[100px]">{item.name}</span>
          </button>
        ))}
        {data.length > 10 && (
          <span className="text-xs text-muted-foreground self-center">
            +{data.length - 10} more
          </span>
        )}
      </div>

      {/* Tooltip */}
      {hoveredId && (() => {
        const item = data.find((d) => d.id === hoveredId);
        if (!item) return null;

        return (
          <div className="absolute top-2 right-2 p-3 bg-popover border border-border rounded-lg shadow-lg z-10 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <ColorDot color={getRunColor(data.findIndex((d) => d.id === hoveredId))} />
              <span className="font-medium text-sm truncate">{item.name}</span>
            </div>
            <div className="space-y-1">
              {axes.map((axis) => {
                const value = item.values[axis.key];
                return (
                  <div key={axis.key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{axis.label}</span>
                    <span className="font-mono">
                      {axis.format ? axis.format(value) : value?.toFixed(4) ?? "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default ParallelCoordinates;

