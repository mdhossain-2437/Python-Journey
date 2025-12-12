/**
 * Neural Network Particle System Animation
 *
 * Features:
 * - Animated neurons with firing effects
 * - Signal particles flowing between neurons
 * - Pulse waves on activation
 * - Real-time weight visualization
 * - Glow effects and particle trails
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Zap, Settings } from "lucide-react";

// ==================== TYPES ====================

interface Neuron {
  id: string;
  x: number;
  y: number;
  layer: number;
  index: number;
  activation: number;
  firing: boolean;
  pulseRadius: number;
  lastFired: number;
}

interface Connection {
  from: Neuron;
  to: Neuron;
  weight: number;
  particles: SignalParticle[];
}

interface SignalParticle {
  id: string;
  progress: number; // 0 to 1
  speed: number;
  intensity: number;
  color: string;
}

interface NeuralParticleSystemProps {
  layers: number[];
  isTraining?: boolean;
  trainingProgress?: number;
  epoch?: number;
  height?: number;
  className?: string;
}

// ==================== HELPER FUNCTIONS ====================

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const getActivationColor = (activation: number): string => {
  if (activation > 0.7) return "#22c55e"; // Green - high activation
  if (activation > 0.4) return "#eab308"; // Yellow - medium
  if (activation > 0.1) return "#f97316"; // Orange - low
  return "#6366f1"; // Purple - dormant
};

const getWeightColor = (weight: number): string => {
  if (weight > 0.5) return "#22c55e";
  if (weight > 0) return "#4ade80";
  if (weight > -0.5) return "#f87171";
  return "#ef4444";
};

// ==================== MAIN COMPONENT ====================

export function NeuralParticleSystem({
  layers,
  isTraining = false,
  trainingProgress = 0,
  epoch = 0,
  height = 500,
  className,
}: NeuralParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [particleSpeed, setParticleSpeed] = useState(2);
  const [glowIntensity, setGlowIntensity] = useState(1);

  // Initialize neurons and connections
  const { neurons, connections } = useMemo(() => {
    const maxNeuronsPerLayer = 8;
    const padding = { x: 80, y: 60 };
    const width = 800;
    const layerSpacing = (width - padding.x * 2) / (layers.length - 1);

    const allNeurons: Neuron[] = [];
    const allConnections: Connection[] = [];

    // Create neurons
    layers.forEach((count, layerIdx) => {
      const neuronsInLayer = Math.min(count, maxNeuronsPerLayer);
      const layerHeight = height - padding.y * 2;
      const neuronSpacing = layerHeight / (neuronsInLayer + 1);

      for (let i = 0; i < neuronsInLayer; i++) {
        allNeurons.push({
          id: `n-${layerIdx}-${i}`,
          x: padding.x + layerIdx * layerSpacing,
          y: padding.y + (i + 1) * neuronSpacing,
          layer: layerIdx,
          index: i,
          activation: seededRandom(layerIdx * 100 + i) * 0.5,
          firing: false,
          pulseRadius: 0,
          lastFired: 0,
        });
      }
    });

    // Create connections
    for (let l = 0; l < layers.length - 1; l++) {
      const fromNeurons = allNeurons.filter(n => n.layer === l);
      const toNeurons = allNeurons.filter(n => n.layer === l + 1);

      fromNeurons.forEach(from => {
        toNeurons.forEach(to => {
          const weight = (seededRandom(from.index * 100 + to.index * 10 + l) - 0.5) * 2;
          allConnections.push({
            from,
            to,
            weight,
            particles: [],
          });
        });
      });
    }

    return { neurons: allNeurons, connections: allConnections };
  }, [layers, height]);

  // Animation state
  const stateRef = useRef({
    neurons: neurons.map(n => ({ ...n })),
    connections: connections.map(c => ({ ...c, particles: [] as SignalParticle[] })),
    time: 0,
    lastParticleSpawn: 0,
  });

  // Update state reference when props change
  useEffect(() => {
    stateRef.current.neurons = neurons.map(n => ({ ...n }));
    stateRef.current.connections = connections.map(c => ({ ...c, particles: [] }));
  }, [neurons, connections]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const animate = (timestamp: number) => {
      if (!isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const state = stateRef.current;
      state.time = timestamp;

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Draw background grid
      drawGrid(ctx, rect.width, rect.height);

      // Update and draw connections with particles
      state.connections.forEach((conn, connIdx) => {
        // Update particles
        conn.particles = conn.particles.filter(p => {
          p.progress += p.speed * particleSpeed * 0.01;
          return p.progress < 1;
        });

        // Spawn new particles based on training activity
        const spawnRate = isTraining ? 0.05 + trainingProgress * 0.1 : 0.02;
        if (Math.random() < spawnRate && Math.abs(conn.weight) > 0.2) {
          conn.particles.push({
            id: `p-${connIdx}-${timestamp}`,
            progress: 0,
            speed: 0.5 + Math.random() * 0.5,
            intensity: Math.abs(conn.weight),
            color: conn.weight > 0 ? "#22c55e" : "#ef4444",
          });
        }

        // Draw connection line
        drawConnection(ctx, conn, glowIntensity);

        // Draw particles
        conn.particles.forEach(particle => {
          drawParticle(ctx, conn, particle, glowIntensity);
        });
      });

      // Update and draw neurons
      state.neurons.forEach((neuron, idx) => {
        // Update activation based on incoming signals
        const incomingConnections = state.connections.filter(c => c.to.id === neuron.id);
        let totalInput = 0;
        incomingConnections.forEach(conn => {
          conn.particles.forEach(p => {
            if (p.progress > 0.9) {
              totalInput += p.intensity * conn.weight;
            }
          });
        });

        // Update activation with decay
        neuron.activation = Math.max(0, Math.min(1, neuron.activation * 0.98 + totalInput * 0.1));

        // Training progress affects layer activations
        if (isTraining) {
          const layerEffect = neuron.layer === 0 ? 0.5 :
                             neuron.layer === layers.length - 1 ? trainingProgress :
                             0.3 + trainingProgress * 0.4;
          neuron.activation = lerp(neuron.activation, layerEffect + seededRandom(idx + epoch) * 0.3, 0.05);
        }

        // Check for firing
        if (neuron.activation > 0.6 && timestamp - neuron.lastFired > 500) {
          neuron.firing = true;
          neuron.pulseRadius = 0;
          neuron.lastFired = timestamp;
        }

        // Update pulse
        if (neuron.firing) {
          neuron.pulseRadius += 2;
          if (neuron.pulseRadius > 50) {
            neuron.firing = false;
            neuron.pulseRadius = 0;
          }
        }

        // Draw neuron
        drawNeuron(ctx, neuron, glowIntensity);
      });

      // Draw layer labels
      drawLayerLabels(ctx, layers, rect.width, rect.height);

      // Draw training info overlay
      if (isTraining) {
        drawTrainingOverlay(ctx, epoch, trainingProgress, rect.width, rect.height);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, isTraining, trainingProgress, epoch, layers, particleSpeed, glowIntensity]);

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      {/* Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          title={isAnimating ? "Pause" : "Play"}
        >
          {isAnimating ? (
            <Pause className="h-4 w-4 text-white" />
          ) : (
            <Play className="h-4 w-4 text-white" />
          )}
        </button>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          title="Settings"
        >
          <Settings className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-14 right-3 p-3 bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 z-10 min-w-[180px]">
          <div className="text-xs text-white/60 mb-2">Particle Speed</div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={particleSpeed}
            onChange={(e) => setParticleSpeed(Number(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-white/60 mb-2 mt-3">Glow Intensity</div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.2"
            value={glowIntensity}
            onChange={(e) => setGlowIntensity(Number(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isTraining ? "bg-green-500 animate-pulse" : "bg-gray-500"
        )} />
        <span className="text-xs text-white/70">
          {isTraining ? `Training (Epoch ${epoch})` : "Idle"}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height }}
        className="bg-black"
      />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 text-xs text-white/60">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>High Activity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}

// ==================== DRAWING FUNCTIONS ====================

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  conn: Connection,
  glowIntensity: number
) {
  const { from, to, weight } = conn;
  const opacity = Math.abs(weight) * 0.3 + 0.05;
  const color = weight > 0 ? `rgba(34, 197, 94, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;

  // Draw glow
  if (glowIntensity > 0 && Math.abs(weight) > 0.3) {
    ctx.shadowBlur = 10 * glowIntensity;
    ctx.shadowColor = weight > 0 ? "#22c55e" : "#ef4444";
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.abs(weight) * 2 + 0.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  conn: Connection,
  particle: SignalParticle,
  glowIntensity: number
) {
  const { from, to } = conn;
  const x = lerp(from.x, to.x, particle.progress);
  const y = lerp(from.y, to.y, particle.progress);
  const size = 3 + particle.intensity * 3;

  // Glow effect
  if (glowIntensity > 0) {
    ctx.shadowBlur = 15 * glowIntensity;
    ctx.shadowColor = particle.color;
  }

  // Draw particle with trail
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
  gradient.addColorStop(0, particle.color);
  gradient.addColorStop(0.5, particle.color + "80");
  gradient.addColorStop(1, "transparent");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size * 2, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawNeuron(
  ctx: CanvasRenderingContext2D,
  neuron: Neuron,
  glowIntensity: number
) {
  const { x, y, activation, firing, pulseRadius } = neuron;
  const baseRadius = 12;
  const color = getActivationColor(activation);

  // Draw pulse wave if firing
  if (firing && pulseRadius > 0) {
    const pulseOpacity = 1 - pulseRadius / 50;
    ctx.strokeStyle = `rgba(255, 255, 255, ${pulseOpacity * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, baseRadius + pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Outer glow
  if (glowIntensity > 0 && activation > 0.3) {
    ctx.shadowBlur = 20 * glowIntensity * activation;
    ctx.shadowColor = color;
  }

  // Neuron body gradient
  const gradient = ctx.createRadialGradient(
    x - baseRadius * 0.3,
    y - baseRadius * 0.3,
    0,
    x,
    y,
    baseRadius
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, color + "80");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = activation > 0.5 ? "#ffffff" : "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = activation > 0.5 ? 2 : 1;
  ctx.stroke();

  // Inner activation indicator
  if (activation > 0.2) {
    const innerRadius = baseRadius * 0.4 * activation;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function drawLayerLabels(
  ctx: CanvasRenderingContext2D,
  layers: number[],
  width: number,
  height: number
) {
  const padding = 80;
  const layerSpacing = (width - padding * 2) / (layers.length - 1);

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";

  const labels = layers.map((count, i) => {
    if (i === 0) return `Input\n(${count})`;
    if (i === layers.length - 1) return `Output\n(${count})`;
    return `Hidden ${i}\n(${count})`;
  });

  labels.forEach((label, i) => {
    const x = padding + i * layerSpacing;
    const lines = label.split("\n");
    lines.forEach((line, lineIdx) => {
      ctx.fillText(line, x, height - 25 + lineIdx * 12);
    });
  });
}

function drawTrainingOverlay(
  ctx: CanvasRenderingContext2D,
  epoch: number,
  progress: number,
  width: number,
  height: number
) {
  // Progress bar
  const barWidth = 150;
  const barHeight = 4;
  const barX = width - barWidth - 15;
  const barY = height - 25;

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Progress fill
  const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
  gradient.addColorStop(0, "#22c55e");
  gradient.addColorStop(1, "#4ade80");
  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, barWidth * progress, barHeight);

  // Label
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(progress * 100)}%`, barX - 8, barY + 4);
}

// ==================== EXPORT ====================

export default NeuralParticleSystem;

