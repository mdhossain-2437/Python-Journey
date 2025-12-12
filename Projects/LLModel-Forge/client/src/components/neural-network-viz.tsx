/**
 * Advanced Neural Network Visualization
 *
 * Features:
 * - Interactive neural network architecture visualization
 * - DAG/Lineage graph for data flow
 * - Real-time weight visualization
 * - Layer-by-layer activation maps
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Play,
  Pause,
  RotateCcw,
  Layers,
  GitBranch,
  Database,
  Cpu,
  Box,
  ArrowRight,
  Info,
} from "lucide-react";

// ==================== NEURAL NETWORK VISUALIZATION ====================

interface NeuronProps {
  x: number;
  y: number;
  radius: number;
  activation?: number; // -1 to 1
  isInput?: boolean;
  isOutput?: boolean;
  label?: string;
  onHover?: (info: any) => void;
}

function Neuron({ x, y, radius, activation = 0, isInput, isOutput, label, onHover }: NeuronProps) {
  // Map activation to color (blue for negative, white for 0, red for positive)
  const getColor = (a: number) => {
    if (a >= 0) {
      const intensity = Math.min(255, Math.round(a * 255));
      return `rgb(${intensity}, ${Math.round(intensity * 0.3)}, ${Math.round(intensity * 0.3)})`;
    } else {
      const intensity = Math.min(255, Math.round(-a * 255));
      return `rgb(${Math.round(intensity * 0.3)}, ${Math.round(intensity * 0.3)}, ${intensity})`;
    }
  };

  return (
    <g
      onMouseEnter={() => onHover?.({ x, y, activation, isInput, isOutput })}
      onMouseLeave={() => onHover?.(null)}
      className="cursor-pointer"
    >
      {/* Outer glow for activated neurons */}
      {Math.abs(activation) > 0.5 && (
        <circle
          cx={x}
          cy={y}
          r={radius + 4}
          fill="none"
          stroke={getColor(activation)}
          strokeWidth={2}
          opacity={0.3}
        />
      )}

      {/* Main neuron */}
      <circle
        cx={x}
        cy={y}
        r={radius}
        fill={getColor(activation)}
        stroke={isInput ? "#22c55e" : isOutput ? "#f59e0b" : "#6366f1"}
        strokeWidth={isInput || isOutput ? 3 : 2}
      />

      {/* Label */}
      {label && (
        <text
          x={x}
          y={y + radius + 15}
          textAnchor="middle"
          className="text-xs fill-muted-foreground"
        >
          {label}
        </text>
      )}
    </g>
  );
}

interface ConnectionProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: number; // -1 to 1
  animated?: boolean;
}

function Connection({ x1, y1, x2, y2, weight, animated }: ConnectionProps) {
  const opacity = Math.abs(weight) * 0.8 + 0.1;
  const strokeWidth = Math.abs(weight) * 2 + 0.5;
  const color = weight >= 0 ? "#22c55e" : "#ef4444";

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
      strokeDasharray={animated ? "5,5" : undefined}
      className={animated ? "animate-dash" : ""}
    />
  );
}

interface NeuralNetworkVisualizerProps {
  layers: number[]; // e.g., [784, 256, 128, 10]
  weights?: number[][][]; // weights[layer][from][to]
  activations?: number[][]; // activations[layer][neuron]
  layerNames?: string[];
  animated?: boolean;
  className?: string;
}

export function NeuralNetworkVisualizer({
  layers,
  weights,
  activations,
  layerNames,
  animated = false,
  className,
}: NeuralNetworkVisualizerProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredNeuron, setHoveredNeuron] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate layout
  const layout = useMemo(() => {
    const maxNeurons = Math.max(...layers);
    const padding = 60;
    const width = 800;
    const height = Math.max(400, maxNeurons * 30 + padding * 2);
    const layerSpacing = (width - padding * 2) / (layers.length - 1);
    const neuronRadius = Math.min(15, 200 / maxNeurons);

    const positions: Array<Array<{ x: number; y: number }>> = [];

    for (let l = 0; l < layers.length; l++) {
      const layerPositions: Array<{ x: number; y: number }> = [];
      const numNeurons = Math.min(layers[l], 20); // Limit displayed neurons
      const neuronSpacing = (height - padding * 2) / (numNeurons + 1);

      for (let n = 0; n < numNeurons; n++) {
        layerPositions.push({
          x: padding + l * layerSpacing,
          y: padding + (n + 1) * neuronSpacing,
        });
      }

      // Add indicator for hidden neurons
      if (layers[l] > 20) {
        layerPositions.push({
          x: padding + l * layerSpacing,
          y: height / 2,
        });
      }

      positions.push(layerPositions);
    }

    return { positions, width, height, neuronRadius, padding };
  }, [layers]);

  // Generate random weights if not provided
  const displayWeights = useMemo(() => {
    if (weights) return weights;
    return layers.slice(0, -1).map((from, l) => {
      const to = layers[l + 1];
      return Array(Math.min(from, 20)).fill(null).map(() =>
        Array(Math.min(to, 20)).fill(null).map(() => (Math.random() - 0.5) * 2)
      );
    });
  }, [layers, weights]);

  // Generate random activations if not provided
  const displayActivations = useMemo(() => {
    if (activations) return activations;
    return layers.map(n =>
      Array(Math.min(n, 20)).fill(null).map(() => (Math.random() - 0.5) * 2)
    );
  }, [layers, activations]);

  return (
    <div className={cn("relative", className)}>
      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <button
          onClick={() => setZoom(z => Math.min(2, z + 0.2))}
          className="p-1.5 bg-background/80 border border-border rounded hover:bg-muted"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
          className="p-1.5 bg-background/80 border border-border rounded hover:bg-muted"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1.5 bg-background/80 border border-border rounded hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Network Visualization */}
      <div className="overflow-auto border border-border rounded-lg bg-black/20">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            width: layout.width * zoom,
            height: layout.height * zoom,
            minWidth: '100%',
          }}
          className="mx-auto"
        >
          <defs>
            {/* Gradient for connections */}
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Connections */}
          <g className="connections">
            {layout.positions.slice(0, -1).map((layerPos, l) =>
              layerPos.map((from, i) =>
                layout.positions[l + 1].map((to, j) => (
                  <Connection
                    key={`${l}-${i}-${j}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    weight={displayWeights[l]?.[i]?.[j] ?? 0}
                    animated={animated}
                  />
                ))
              )
            )}
          </g>

          {/* Neurons */}
          <g className="neurons">
            {layout.positions.map((layerPos, l) =>
              layerPos.map((pos, n) => (
                <Neuron
                  key={`${l}-${n}`}
                  x={pos.x}
                  y={pos.y}
                  radius={layout.neuronRadius}
                  activation={displayActivations[l]?.[n] ?? 0}
                  isInput={l === 0}
                  isOutput={l === layers.length - 1}
                  onHover={setHoveredNeuron}
                />
              ))
            )}
          </g>

          {/* Layer Labels */}
          <g className="labels">
            {layers.map((count, l) => (
              <text
                key={l}
                x={layout.positions[l][0].x}
                y={layout.padding / 2}
                textAnchor="middle"
                className="text-sm fill-foreground font-medium"
              >
                {layerNames?.[l] || (l === 0 ? "Input" : l === layers.length - 1 ? "Output" : `Hidden ${l}`)}
              </text>
            ))}
            {layers.map((count, l) => (
              <text
                key={`count-${l}`}
                x={layout.positions[l][0].x}
                y={layout.height - layout.padding / 2 + 5}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {count} neurons
              </text>
            ))}
          </g>
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredNeuron && (
        <div className="absolute bottom-2 left-2 p-2 bg-popover border border-border rounded text-xs">
          <div>Activation: {hoveredNeuron.activation?.toFixed(4)}</div>
          <div>Type: {hoveredNeuron.isInput ? "Input" : hoveredNeuron.isOutput ? "Output" : "Hidden"}</div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-700" />
          <span>Negative activation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500" />
          <span>Zero activation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-700" />
          <span>Positive activation</span>
        </div>
      </div>
    </div>
  );
}

// ==================== DAG / LINEAGE GRAPH ====================

export interface DAGNode {
  id: string;
  type: "data" | "transform" | "model" | "artifact" | "metric";
  label: string;
  description?: string;
  status?: "completed" | "running" | "failed" | "pending";
  metadata?: Record<string, any>;
  version?: string;
}

export interface DAGEdge {
  from: string;
  to: string;
  label?: string;
}

interface DAGGraphProps {
  nodes: DAGNode[];
  edges: DAGEdge[];
  onNodeClick?: (node: DAGNode) => void;
  selectedNodeId?: string;
  className?: string;
}

export function DAGGraph({ nodes, edges, onNodeClick, selectedNodeId, className }: DAGGraphProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate layout using topological sort
  const layout = useMemo(() => {
    // Build adjacency list
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    nodes.forEach(n => {
      adj[n.id] = [];
      inDegree[n.id] = 0;
    });

    edges.forEach(e => {
      adj[e.from]?.push(e.to);
      if (inDegree[e.to] !== undefined) inDegree[e.to]++;
    });

    // Topological sort to get layers
    const layers: string[][] = [];
    const visited = new Set<string>();
    const queue = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);

    while (queue.length > 0) {
      const layer: string[] = [];
      const nextQueue: string[] = [];

      for (const nodeId of queue) {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          layer.push(nodeId);

          for (const next of adj[nodeId] || []) {
            inDegree[next]--;
            if (inDegree[next] === 0) {
              nextQueue.push(next);
            }
          }
        }
      }

      if (layer.length > 0) layers.push(layer);
      queue.length = 0;
      queue.push(...nextQueue);
    }

    // Add any remaining nodes (cycles or disconnected)
    const remaining = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
    if (remaining.length > 0) layers.push(remaining);

    // Calculate positions
    const nodeWidth = 160;
    const nodeHeight = 60;
    const layerSpacing = 200;
    const nodeSpacing = 100;
    const padding = 50;

    const positions: Record<string, { x: number; y: number }> = {};
    const height = Math.max(...layers.map(l => l.length)) * nodeSpacing + padding * 2;

    layers.forEach((layer, layerIndex) => {
      const layerHeight = layer.length * nodeSpacing;
      const startY = (height - layerHeight) / 2 + nodeSpacing / 2;

      layer.forEach((nodeId, nodeIndex) => {
        positions[nodeId] = {
          x: padding + layerIndex * layerSpacing,
          y: startY + nodeIndex * nodeSpacing,
        };
      });
    });

    const width = layers.length * layerSpacing + padding * 2;

    return { positions, width, height, nodeWidth, nodeHeight };
  }, [nodes, edges]);

  // Get icon for node type
  const getNodeIcon = (type: DAGNode["type"]) => {
    switch (type) {
      case "data": return <Database className="h-5 w-5" />;
      case "transform": return <Cpu className="h-5 w-5" />;
      case "model": return <Layers className="h-5 w-5" />;
      case "artifact": return <Box className="h-5 w-5" />;
      case "metric": return <GitBranch className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  // Get color for node type
  const getNodeColor = (type: DAGNode["type"], status?: DAGNode["status"]) => {
    if (status === "failed") return "border-red-500 bg-red-500/10";
    if (status === "running") return "border-blue-500 bg-blue-500/10";
    if (status === "pending") return "border-gray-500 bg-gray-500/10";

    switch (type) {
      case "data": return "border-green-500 bg-green-500/10";
      case "transform": return "border-purple-500 bg-purple-500/10";
      case "model": return "border-orange-500 bg-orange-500/10";
      case "artifact": return "border-cyan-500 bg-cyan-500/10";
      case "metric": return "border-pink-500 bg-pink-500/10";
      default: return "border-border bg-card";
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        <button
          onClick={() => setZoom(z => Math.min(2, z + 0.2))}
          className="p-1.5 bg-background/80 border border-border rounded hover:bg-muted"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
          className="p-1.5 bg-background/80 border border-border rounded hover:bg-muted"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 bg-background/80 border border-border rounded hover:bg-muted"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Graph */}
      <div className="overflow-auto border border-border rounded-lg bg-black/10">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            width: layout.width * zoom,
            height: layout.height * zoom,
            minWidth: '100%',
            minHeight: 300,
          }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
            </marker>
          </defs>

          {/* Edges */}
          <g className="edges">
            {edges.map((edge, i) => {
              const from = layout.positions[edge.from];
              const to = layout.positions[edge.to];
              if (!from || !to) return null;

              const startX = from.x + layout.nodeWidth;
              const startY = from.y;
              const endX = to.x;
              const endY = to.y;

              // Create curved path
              const midX = (startX + endX) / 2;
              const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

              return (
                <g key={i}>
                  <path
                    d={path}
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead)"
                    opacity={0.5}
                  />
                  {edge.label && (
                    <text
                      x={midX}
                      y={(startY + endY) / 2 - 10}
                      textAnchor="middle"
                      className="text-xs fill-muted-foreground"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {nodes.map(node => {
              const pos = layout.positions[node.id];
              if (!pos) return null;

              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNode === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y - layout.nodeHeight / 2})`}
                  onClick={() => onNodeClick?.(node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer"
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <rect
                      x={-4}
                      y={-4}
                      width={layout.nodeWidth + 8}
                      height={layout.nodeHeight + 8}
                      rx={12}
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                  )}

                  {/* Node background */}
                  <rect
                    width={layout.nodeWidth}
                    height={layout.nodeHeight}
                    rx={8}
                    className={cn(
                      "fill-card stroke-2 transition-all",
                      getNodeColor(node.type, node.status),
                      (isHovered || isSelected) && "stroke-[3]"
                    )}
                  />

                  {/* Status indicator */}
                  {node.status === "running" && (
                    <circle
                      cx={layout.nodeWidth - 12}
                      cy={12}
                      r={5}
                      className="fill-blue-500 animate-pulse"
                    />
                  )}
                  {node.status === "failed" && (
                    <circle
                      cx={layout.nodeWidth - 12}
                      cy={12}
                      r={5}
                      className="fill-red-500"
                    />
                  )}
                  {node.status === "completed" && (
                    <circle
                      cx={layout.nodeWidth - 12}
                      cy={12}
                      r={5}
                      className="fill-green-500"
                    />
                  )}

                  {/* Icon */}
                  <foreignObject x={10} y={(layout.nodeHeight - 24) / 2} width={24} height={24}>
                    <div className="text-muted-foreground">
                      {getNodeIcon(node.type)}
                    </div>
                  </foreignObject>

                  {/* Label */}
                  <text
                    x={42}
                    y={layout.nodeHeight / 2 - 4}
                    className="text-sm fill-foreground font-medium"
                  >
                    {node.label.length > 14 ? node.label.slice(0, 12) + "..." : node.label}
                  </text>

                  {/* Version */}
                  {node.version && (
                    <text
                      x={42}
                      y={layout.nodeHeight / 2 + 12}
                      className="text-xs fill-muted-foreground"
                    >
                      {node.version}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Node Details Panel */}
      {hoveredNode && (() => {
        const node = nodes.find(n => n.id === hoveredNode);
        if (!node) return null;

        return (
          <div className="absolute bottom-2 left-2 p-3 bg-popover border border-border rounded-lg shadow-lg max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              {getNodeIcon(node.type)}
              <span className="font-medium">{node.label}</span>
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground mb-2">{node.description}</p>
            )}
            {node.metadata && Object.entries(node.metadata).slice(0, 3).map(([key, value]) => (
              <div key={key} className="text-xs flex justify-between">
                <span className="text-muted-foreground">{key}:</span>
                <span className="font-mono">{String(value).slice(0, 20)}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-500/20" />
          <span>Data</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-purple-500 bg-purple-500/20" />
          <span>Transform</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-orange-500 bg-orange-500/20" />
          <span>Model</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border-2 border-cyan-500 bg-cyan-500/20" />
          <span>Artifact</span>
        </div>
      </div>
    </div>
  );
}

// ==================== MODEL ARCHITECTURE BUILDER ====================

interface LayerConfig {
  id: string;
  type: "dense" | "conv2d" | "maxpool" | "flatten" | "dropout" | "batchnorm" | "attention" | "lstm" | "gru";
  params: Record<string, any>;
}

interface ModelArchitectureBuilderProps {
  layers: LayerConfig[];
  onLayersChange?: (layers: LayerConfig[]) => void;
  readOnly?: boolean;
  className?: string;
}

export function ModelArchitectureBuilder({
  layers,
  onLayersChange,
  readOnly = false,
  className
}: ModelArchitectureBuilderProps) {
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);

  const layerIcons: Record<string, React.ReactNode> = {
    dense: <Layers className="h-4 w-4" />,
    conv2d: <Box className="h-4 w-4" />,
    maxpool: <ArrowRight className="h-4 w-4" />,
    flatten: <ArrowRight className="h-4 w-4" />,
    dropout: <GitBranch className="h-4 w-4" />,
    batchnorm: <Database className="h-4 w-4" />,
    attention: <Cpu className="h-4 w-4" />,
    lstm: <ArrowRight className="h-4 w-4" />,
    gru: <ArrowRight className="h-4 w-4" />,
  };

  const layerColors: Record<string, string> = {
    dense: "bg-blue-500/20 border-blue-500",
    conv2d: "bg-green-500/20 border-green-500",
    maxpool: "bg-yellow-500/20 border-yellow-500",
    flatten: "bg-gray-500/20 border-gray-500",
    dropout: "bg-red-500/20 border-red-500",
    batchnorm: "bg-purple-500/20 border-purple-500",
    attention: "bg-pink-500/20 border-pink-500",
    lstm: "bg-cyan-500/20 border-cyan-500",
    gru: "bg-orange-500/20 border-orange-500",
  };

  const getLayerDescription = (layer: LayerConfig): string => {
    switch (layer.type) {
      case "dense":
        return `Dense(${layer.params.units}, ${layer.params.activation || 'linear'})`;
      case "conv2d":
        return `Conv2D(${layer.params.filters}, ${layer.params.kernelSize}×${layer.params.kernelSize})`;
      case "maxpool":
        return `MaxPool2D(${layer.params.poolSize}×${layer.params.poolSize})`;
      case "dropout":
        return `Dropout(${layer.params.rate})`;
      case "batchnorm":
        return `BatchNorm()`;
      case "flatten":
        return `Flatten()`;
      case "attention":
        return `Attention(heads=${layer.params.heads})`;
      case "lstm":
        return `LSTM(${layer.params.units})`;
      case "gru":
        return `GRU(${layer.params.units})`;
      default:
        return layer.type;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Layer Stack */}
      <div className="flex flex-col items-center gap-1">
        {/* Input */}
        <div className="px-4 py-2 rounded-lg bg-green-500/20 border-2 border-green-500 text-sm font-medium">
          Input Layer
        </div>

        <div className="h-6 w-px bg-border" />

        {layers.map((layer, index) => (
          <React.Fragment key={layer.id}>
            <div
              className={cn(
                "px-4 py-2 rounded-lg border-2 text-sm cursor-pointer transition-all min-w-[200px] text-center",
                layerColors[layer.type],
                selectedLayer === layer.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedLayer(layer.id === selectedLayer ? null : layer.id)}
            >
              <div className="flex items-center justify-center gap-2">
                {layerIcons[layer.type]}
                <span className="font-mono text-xs">{getLayerDescription(layer)}</span>
              </div>
            </div>
            {index < layers.length - 1 && <div className="h-6 w-px bg-border" />}
          </React.Fragment>
        ))}

        <div className="h-6 w-px bg-border" />

        {/* Output */}
        <div className="px-4 py-2 rounded-lg bg-orange-500/20 border-2 border-orange-500 text-sm font-medium">
          Output Layer
        </div>
      </div>

      {/* Layer Details */}
      {selectedLayer && (() => {
        const layer = layers.find(l => l.id === selectedLayer);
        if (!layer) return null;

        return (
          <div className="mt-4 p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              {layerIcons[layer.type]}
              <span className="font-medium capitalize">{layer.type} Layer</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(layer.params).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key}:</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default {
  NeuralNetworkVisualizer,
  DAGGraph,
  ModelArchitectureBuilder,
};

