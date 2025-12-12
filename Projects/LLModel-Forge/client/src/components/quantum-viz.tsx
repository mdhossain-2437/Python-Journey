/**
 * Quantum Machine Learning Visualization
 *
 * Features:
 * - Quantum circuit visualization
 * - Bloch sphere representation
 * - Quantum state evolution
 * - Variational quantum eigensolver (VQE) visualization
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Complex, QuantumState, QuantumGates } from "@/lib/ml-math";
import {
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Zap,
  GitBranch,
  Settings2,
  Plus,
} from "lucide-react";

// ==================== BLOCH SPHERE ====================

interface BlochSphereProps {
  theta: number; // Polar angle (0 to π)
  phi: number;   // Azimuthal angle (0 to 2π)
  size?: number;
  showLabels?: boolean;
  className?: string;
}

export function BlochSphere({
  theta,
  phi,
  size = 200,
  showLabels = true,
  className
}: BlochSphereProps) {
  // Calculate 3D position on sphere surface
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.sin(theta) * Math.sin(phi);
  const z = Math.cos(theta);

  // Project to 2D (isometric view)
  const projX = (x - y) * 0.866 * (size / 2.5);
  const projY = (x + y) * 0.5 - z * (size / 2.5);
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("", className)}
      style={{ width: size, height: size }}
    >
      <defs>
        {/* Sphere gradient */}
        <radialGradient id="sphereGradient" cx="40%" cy="40%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </radialGradient>
      </defs>

      {/* Sphere outline */}
      <circle
        cx={centerX}
        cy={centerY}
        r={size / 2.5}
        fill="url(#sphereGradient)"
        stroke="hsl(var(--border))"
        strokeWidth={1}
      />

      {/* Equator ellipse */}
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={size / 2.5}
        ry={size / 6}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={1}
        strokeDasharray="4 2"
      />

      {/* Prime meridian */}
      <ellipse
        cx={centerX}
        cy={centerY}
        rx={size / 6}
        ry={size / 2.5}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth={1}
        strokeDasharray="4 2"
      />

      {/* Axes */}
      <line
        x1={centerX - size / 3}
        y1={centerY + size / 6}
        x2={centerX + size / 3}
        y2={centerY - size / 6}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1}
        opacity={0.5}
      />
      <line
        x1={centerX}
        y1={centerY - size / 2.5}
        x2={centerX}
        y2={centerY + size / 2.5}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={1}
        opacity={0.5}
      />

      {/* State vector */}
      <line
        x1={centerX}
        y1={centerY}
        x2={centerX + projX}
        y2={centerY - projY}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        markerEnd="url(#arrow)"
      />

      {/* State point */}
      <circle
        cx={centerX + projX}
        cy={centerY - projY}
        r={6}
        fill="hsl(var(--primary))"
        stroke="white"
        strokeWidth={2}
      />

      {/* Labels */}
      {showLabels && (
        <>
          <text x={centerX} y={centerY - size / 2.5 - 8} textAnchor="middle" className="text-xs fill-muted-foreground">|0⟩</text>
          <text x={centerX} y={centerY + size / 2.5 + 16} textAnchor="middle" className="text-xs fill-muted-foreground">|1⟩</text>
          <text x={centerX + size / 3 + 10} y={centerY - size / 6} className="text-xs fill-muted-foreground">X</text>
          <text x={centerX - size / 3 - 10} y={centerY + size / 6 + 4} className="text-xs fill-muted-foreground">Y</text>
        </>
      )}

      {/* Arrow marker */}
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="hsl(var(--primary))" />
        </marker>
      </defs>
    </svg>
  );
}

// ==================== QUANTUM CIRCUIT ====================

interface QuantumGate {
  type: "H" | "X" | "Y" | "Z" | "S" | "T" | "CNOT" | "SWAP" | "RX" | "RY" | "RZ" | "MEASURE";
  qubits: number[];
  params?: number[];
  label?: string;
}

interface QuantumCircuitProps {
  numQubits: number;
  gates: QuantumGate[];
  onGateClick?: (index: number) => void;
  highlightedStep?: number;
  className?: string;
}

export function QuantumCircuit({
  numQubits,
  gates,
  onGateClick,
  highlightedStep,
  className,
}: QuantumCircuitProps) {
  const qubitSpacing = 50;
  const gateSpacing = 60;
  const padding = { left: 60, top: 30, right: 40, bottom: 30 };
  const gateSize = 36;

  const width = padding.left + (gates.length + 1) * gateSpacing + padding.right;
  const height = padding.top + numQubits * qubitSpacing + padding.bottom;

  // Gate colors
  const gateColors: Record<string, string> = {
    H: "#6366f1",
    X: "#ef4444",
    Y: "#22c55e",
    Z: "#3b82f6",
    S: "#8b5cf6",
    T: "#f59e0b",
    CNOT: "#ec4899",
    SWAP: "#06b6d4",
    RX: "#f97316",
    RY: "#84cc16",
    RZ: "#14b8a6",
    MEASURE: "#64748b",
  };

  return (
    <div className={cn("overflow-auto", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-full" style={{ height }}>
        {/* Qubit lines */}
        {Array.from({ length: numQubits }, (_, i) => (
          <g key={`qubit-${i}`}>
            <text
              x={padding.left - 40}
              y={padding.top + i * qubitSpacing + 5}
              className="text-sm fill-muted-foreground font-mono"
            >
              q[{i}]
            </text>
            <text
              x={padding.left - 15}
              y={padding.top + i * qubitSpacing + 5}
              className="text-sm fill-foreground font-mono"
            >
              |0⟩
            </text>
            <line
              x1={padding.left}
              y1={padding.top + i * qubitSpacing}
              x2={width - padding.right}
              y2={padding.top + i * qubitSpacing}
              stroke="hsl(var(--border))"
              strokeWidth={2}
            />
          </g>
        ))}

        {/* Gates */}
        {gates.map((gate, gateIndex) => {
          const x = padding.left + (gateIndex + 0.5) * gateSpacing;
          const isHighlighted = highlightedStep === gateIndex;
          const color = gateColors[gate.type] || "#6366f1";

          if (gate.type === "CNOT") {
            const controlY = padding.top + gate.qubits[0] * qubitSpacing;
            const targetY = padding.top + gate.qubits[1] * qubitSpacing;

            return (
              <g
                key={gateIndex}
                onClick={() => onGateClick?.(gateIndex)}
                className="cursor-pointer"
              >
                {/* Highlight */}
                {isHighlighted && (
                  <rect
                    x={x - gateSpacing / 2}
                    y={0}
                    width={gateSpacing}
                    height={height}
                    fill={color}
                    opacity={0.1}
                  />
                )}
                {/* Control-target line */}
                <line
                  x1={x}
                  y1={controlY}
                  x2={x}
                  y2={targetY}
                  stroke={color}
                  strokeWidth={2}
                />
                {/* Control dot */}
                <circle cx={x} cy={controlY} r={6} fill={color} />
                {/* Target circle (XOR) */}
                <circle cx={x} cy={targetY} r={12} fill="none" stroke={color} strokeWidth={2} />
                <line x1={x - 8} y1={targetY} x2={x + 8} y2={targetY} stroke={color} strokeWidth={2} />
                <line x1={x} y1={targetY - 8} x2={x} y2={targetY + 8} stroke={color} strokeWidth={2} />
              </g>
            );
          }

          if (gate.type === "MEASURE") {
            const y = padding.top + gate.qubits[0] * qubitSpacing;

            return (
              <g
                key={gateIndex}
                onClick={() => onGateClick?.(gateIndex)}
                className="cursor-pointer"
              >
                <rect
                  x={x - gateSize / 2}
                  y={y - gateSize / 2}
                  width={gateSize}
                  height={gateSize}
                  rx={4}
                  fill="hsl(var(--muted))"
                  stroke={color}
                  strokeWidth={2}
                />
                {/* Meter symbol */}
                <path
                  d={`M ${x - 8} ${y + 6} Q ${x} ${y - 10} ${x + 8} ${y + 6}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                />
                <line
                  x1={x}
                  y1={y + 6}
                  x2={x + 6}
                  y2={y - 4}
                  stroke={color}
                  strokeWidth={2}
                />
              </g>
            );
          }

          // Single qubit gate
          const y = padding.top + gate.qubits[0] * qubitSpacing;

          return (
            <g
              key={gateIndex}
              onClick={() => onGateClick?.(gateIndex)}
              className="cursor-pointer"
            >
              {/* Highlight */}
              {isHighlighted && (
                <rect
                  x={x - gateSpacing / 2}
                  y={0}
                  width={gateSpacing}
                  height={height}
                  fill={color}
                  opacity={0.1}
                />
              )}
              <rect
                x={x - gateSize / 2}
                y={y - gateSize / 2}
                width={gateSize}
                height={gateSize}
                rx={4}
                fill={color}
                stroke={isHighlighted ? "white" : "none"}
                strokeWidth={2}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                className="text-sm fill-white font-bold"
              >
                {gate.type}
              </text>
              {/* Parameter */}
              {gate.params && gate.params[0] !== undefined && (
                <text
                  x={x}
                  y={y + gateSize / 2 + 12}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground"
                >
                  ({(gate.params[0] / Math.PI).toFixed(2)}π)
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ==================== QUANTUM STATE VISUALIZER ====================

interface QuantumStateVisualizerProps {
  amplitudes: Complex[];
  labels?: string[];
  className?: string;
}

export function QuantumStateVisualizer({
  amplitudes,
  labels,
  className
}: QuantumStateVisualizerProps) {
  const probabilities = amplitudes.map(a => a.magnitude() ** 2);
  const maxProb = Math.max(...probabilities);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium">State Vector</div>
      <div className="grid gap-2">
        {amplitudes.map((amp, i) => {
          const prob = probabilities[i];
          const phase = amp.phase();
          const label = labels?.[i] || `|${i.toString(2).padStart(Math.ceil(Math.log2(amplitudes.length)), '0')}⟩`;

          return (
            <div key={i} className="flex items-center gap-3">
              <span className="font-mono text-sm w-16">{label}</span>

              {/* Probability bar */}
              <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(prob / maxProb) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className="text-xs font-mono">{(prob * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Phase indicator */}
              <div
                className="w-6 h-6 rounded-full border-2 border-muted relative"
                title={`Phase: ${(phase / Math.PI).toFixed(2)}π`}
              >
                <div
                  className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-primary origin-bottom"
                  style={{ transform: `translateX(-50%) rotate(${phase}rad)` }}
                />
              </div>

              {/* Complex value */}
              <span className="text-xs font-mono text-muted-foreground w-24 text-right">
                {amp.real.toFixed(2)} {amp.imag >= 0 ? '+' : ''}{amp.imag.toFixed(2)}i
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== QUANTUM SIMULATOR ====================

interface QuantumSimulatorProps {
  className?: string;
}

export function QuantumSimulator({ className }: QuantumSimulatorProps) {
  const [numQubits, setNumQubits] = useState(2);
  const [gates, setGates] = useState<QuantumGate[]>([
    { type: "H", qubits: [0] },
    { type: "CNOT", qubits: [0, 1] },
  ]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [state, setState] = useState<Complex[]>([]);

  // Initialize state
  useEffect(() => {
    const size = Math.pow(2, numQubits);
    const initialState = Array(size).fill(null).map((_, i) =>
      i === 0 ? new Complex(1, 0) : new Complex(0, 0)
    );
    setState(initialState);
    setCurrentStep(-1);
  }, [numQubits]);

  // Apply gate to state
  const applyGate = (gateIndex: number) => {
    const gate = gates[gateIndex];
    if (!gate) return;

    setState(prevState => {
      const newState = [...prevState];
      const size = newState.length;

      if (gate.type === "H") {
        // Hadamard gate
        const qubit = gate.qubits[0];
        const step = Math.pow(2, qubit);

        for (let i = 0; i < size; i += 2 * step) {
          for (let j = 0; j < step; j++) {
            const idx0 = i + j;
            const idx1 = i + j + step;
            const a0 = newState[idx0];
            const a1 = newState[idx1];

            newState[idx0] = new Complex(
              (a0.real + a1.real) / Math.SQRT2,
              (a0.imag + a1.imag) / Math.SQRT2
            );
            newState[idx1] = new Complex(
              (a0.real - a1.real) / Math.SQRT2,
              (a0.imag - a1.imag) / Math.SQRT2
            );
          }
        }
      } else if (gate.type === "X") {
        // Pauli-X gate
        const qubit = gate.qubits[0];
        const step = Math.pow(2, qubit);

        for (let i = 0; i < size; i += 2 * step) {
          for (let j = 0; j < step; j++) {
            const idx0 = i + j;
            const idx1 = i + j + step;
            const temp = newState[idx0];
            newState[idx0] = newState[idx1];
            newState[idx1] = temp;
          }
        }
      } else if (gate.type === "CNOT") {
        // CNOT gate
        const control = gate.qubits[0];
        const target = gate.qubits[1];

        for (let i = 0; i < size; i++) {
          if ((i >> control) & 1) {
            const j = i ^ (1 << target);
            if (j > i) {
              const temp = newState[i];
              newState[i] = newState[j];
              newState[j] = temp;
            }
          }
        }
      }

      return newState;
    });
  };

  // Run simulation
  useEffect(() => {
    if (!isRunning) return;
    if (currentStep >= gates.length - 1) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      applyGate(nextStep);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRunning, currentStep, gates]);

  // Reset simulation
  const reset = () => {
    setIsRunning(false);
    setCurrentStep(-1);
    const size = Math.pow(2, numQubits);
    setState(Array(size).fill(null).map((_, i) =>
      i === 0 ? new Complex(1, 0) : new Complex(0, 0)
    ));
  };

  // Add gate
  const addGate = (type: QuantumGate["type"]) => {
    const newGate: QuantumGate = {
      type,
      qubits: type === "CNOT" ? [0, 1] : [0],
    };
    setGates([...gates, newGate]);
  };

  // Calculate Bloch sphere angles for first qubit
  const blochAngles = useMemo(() => {
    if (state.length < 2) return { theta: 0, phi: 0 };

    // For a single qubit, state is |ψ⟩ = α|0⟩ + β|1⟩
    // θ = 2 * arccos(|α|), φ = arg(β) - arg(α)
    const alpha = state[0];
    const beta = state[1];

    const theta = 2 * Math.acos(Math.min(1, alpha.magnitude()));
    const phi = beta.phase() - alpha.phase();

    return { theta, phi };
  }, [state]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md",
              isRunning ? "bg-red-500/20 text-red-500" : "bg-primary text-primary-foreground"
            )}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? "Pause" : "Run"}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Add Gate:</span>
          {(["H", "X", "Y", "Z", "CNOT"] as const).map(g => (
            <button
              key={g}
              onClick={() => addGate(g)}
              className="px-2 py-1 text-xs font-mono border border-border rounded hover:bg-muted"
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Circuit */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <div className="text-sm font-medium mb-3">Quantum Circuit</div>
        <QuantumCircuit
          numQubits={numQubits}
          gates={gates}
          highlightedStep={currentStep}
          onGateClick={(i) => {
            if (!isRunning && i <= currentStep) return;
            setCurrentStep(i);
            applyGate(i);
          }}
        />
      </div>

      {/* Visualization */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bloch Sphere */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="text-sm font-medium mb-3">Bloch Sphere (Qubit 0)</div>
          <div className="flex justify-center">
            <BlochSphere
              theta={blochAngles.theta}
              phi={blochAngles.phi}
              size={180}
            />
          </div>
          <div className="text-center mt-2 text-xs text-muted-foreground">
            θ = {(blochAngles.theta / Math.PI).toFixed(3)}π,
            φ = {(blochAngles.phi / Math.PI).toFixed(3)}π
          </div>
        </div>

        {/* State Vector */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <QuantumStateVisualizer
            amplitudes={state}
            labels={Array.from({ length: state.length }, (_, i) =>
              `|${i.toString(2).padStart(numQubits, '0')}⟩`
            )}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 text-center text-sm">
        <div className="p-3 border border-border rounded-lg">
          <div className="text-muted-foreground">Qubits</div>
          <div className="text-xl font-bold">{numQubits}</div>
        </div>
        <div className="p-3 border border-border rounded-lg">
          <div className="text-muted-foreground">Gates</div>
          <div className="text-xl font-bold">{gates.length}</div>
        </div>
        <div className="p-3 border border-border rounded-lg">
          <div className="text-muted-foreground">Step</div>
          <div className="text-xl font-bold">{currentStep + 1}/{gates.length}</div>
        </div>
        <div className="p-3 border border-border rounded-lg">
          <div className="text-muted-foreground">States</div>
          <div className="text-xl font-bold">{state.length}</div>
        </div>
      </div>
    </div>
  );
}

export default {
  BlochSphere,
  QuantumCircuit,
  QuantumStateVisualizer,
  QuantumSimulator,
};

