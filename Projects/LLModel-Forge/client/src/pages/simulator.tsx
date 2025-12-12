/**
 * Advanced ML Simulator Page
 *
 * Features:
 * - Neural Network Architecture Visualization
 * - Quantum ML Simulation
 * - Physics-based Model Training
 * - Real-time Training Visualization
 */

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Cpu,
  Zap,
  Brain,
  Atom,
  TrendingUp,
  Target,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Components
import { NeuralNetworkVisualizer, DAGGraph, ModelArchitectureBuilder, DAGNode, DAGEdge } from "@/components/neural-network-viz";
import { AdvancedScatterPlot, Heatmap, RealTimeMetricStream, PhysicsVisualization, Particle } from "@/components/advanced-viz";
import { MetricChart, SmoothingSlider, getRunColor } from "@/components/wandb-ui";
import { QuantumSimulator, BlochSphere, QuantumStateVisualizer } from "@/components/quantum-viz";
import { Matrix, Activations, LossFunctions, Statistics, Metrics, LRSchedulers, Complex } from "@/lib/ml-math";

// ==================== TRAINING SIMULATOR ====================

interface TrainingState {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
  learningRate: number;
  gradientNorm: number;
}

function useTrainingSimulator(config: {
  epochs: number;
  batchSize: number;
  learningRate: number;
  scheduler: string;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<TrainingState[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    if (currentEpoch >= config.epochs) {
      setIsRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentEpoch(prev => prev + 1);

      // Simulate training metrics
      const progress = (currentEpoch + 1) / config.epochs;
      const noise = () => (Math.random() - 0.5) * 0.05;

      // Learning rate scheduling
      const lr = LRSchedulers[config.scheduler as keyof typeof LRSchedulers]?.(
        config.learningRate,
        config.epochs * 0.1,
        config.epochs
      )?.(currentEpoch) ?? config.learningRate;

      const newState: TrainingState = {
        epoch: currentEpoch + 1,
        loss: Math.max(0.01, 0.8 * Math.exp(-3 * progress) + noise()),
        accuracy: Math.min(0.99, 0.5 + 0.45 * (1 - Math.exp(-4 * progress)) + noise()),
        valLoss: Math.max(0.02, 0.85 * Math.exp(-2.5 * progress) + noise() * 1.5),
        valAccuracy: Math.min(0.98, 0.48 + 0.42 * (1 - Math.exp(-3.5 * progress)) + noise() * 1.2),
        learningRate: lr,
        gradientNorm: Math.max(0.001, 2 * Math.exp(-2 * progress) + Math.abs(noise())),
      };

      setHistory(prev => [...prev, newState]);
    }, 200);

    return () => clearTimeout(timer);
  }, [isRunning, currentEpoch, config]);

  const reset = () => {
    setIsRunning(false);
    setCurrentEpoch(0);
    setHistory([]);
  };

  return {
    isRunning,
    setIsRunning,
    currentEpoch,
    history,
    reset,
    currentState: history[history.length - 1],
  };
}

// ==================== MAIN COMPONENT ====================

export default function Simulator() {
  const [activeTab, setActiveTab] = useState("neural");
  const [smoothing, setSmoothing] = useState(0.6);

  // Training config
  const [trainingConfig, setTrainingConfig] = useState({
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    scheduler: "warmupCosine",
  });

  // Training simulator
  const training = useTrainingSimulator(trainingConfig);

  // Neural network architecture
  const [layers, setLayers] = useState([784, 256, 128, 64, 10]);

  // Sample activations for visualization
  const activations = useMemo(() => {
    if (training.history.length === 0) return undefined;
    const progress = training.currentEpoch / trainingConfig.epochs;

    return layers.map((count, l) =>
      Array(Math.min(count, 20)).fill(null).map(() =>
        (Math.random() - 0.5) * 2 * (l === layers.length - 1 ? 1 : 0.5 + progress * 0.5)
      )
    );
  }, [training.currentEpoch, layers, trainingConfig.epochs]);

  // Chart data
  const chartData = useMemo(() => {
    return training.history.map(h => ({
      epoch: h.epoch,
      loss: h.loss,
      valLoss: h.valLoss,
      accuracy: h.accuracy,
      valAccuracy: h.valAccuracy,
      lr: h.learningRate * 1000, // Scale for visibility
    }));
  }, [training.history]);

  // Confusion matrix (simulated)
  const confusionMatrix = useMemo(() => {
    const progress = training.currentEpoch / trainingConfig.epochs;
    const accuracy = 0.5 + 0.45 * progress;
    const n = 10;

    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => {
        if (i === j) return Math.round(100 * accuracy + Math.random() * 10);
        return Math.round((1 - accuracy) * 10 * Math.random());
      })
    );
  }, [training.currentEpoch, trainingConfig.epochs]);

  // Scatter plot data (t-SNE simulation)
  const scatterData = useMemo(() => {
    const progress = training.currentEpoch / trainingConfig.epochs;
    const clusters = 10;
    const pointsPerCluster = 20;

    return Array.from({ length: clusters }, (_, c) => {
      const centerX = Math.cos(c * 2 * Math.PI / clusters) * 3 * (0.3 + progress * 0.7);
      const centerY = Math.sin(c * 2 * Math.PI / clusters) * 3 * (0.3 + progress * 0.7);

      return Array.from({ length: pointsPerCluster }, (_, p) => ({
        id: `${c}-${p}`,
        x: centerX + (Math.random() - 0.5) * (2 - progress * 1.5),
        y: centerY + (Math.random() - 0.5) * (2 - progress * 1.5),
        category: `Class ${c}`,
        label: `Sample ${c * pointsPerCluster + p}`,
      }));
    }).flat();
  }, [training.currentEpoch, trainingConfig.epochs]);


  // Physics particles (gradient descent visualization)
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: `p${i}`,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      mass: 1 + Math.random() * 2,
      label: `θ${i}`,
    }))
  );

  // DAG for model lineage
  const dagNodes: DAGNode[] = [
    { id: "data", type: "data", label: "Training Data", status: "completed", version: "v1.2" },
    { id: "preprocess", type: "transform", label: "Preprocessing", status: "completed" },
    { id: "augment", type: "transform", label: "Augmentation", status: "completed" },
    { id: "train", type: "model", label: "Model Training", status: training.isRunning ? "running" : "completed" },
    { id: "eval", type: "metric", label: "Evaluation", status: training.currentEpoch > 50 ? "completed" : "pending" },
    { id: "model", type: "artifact", label: "Trained Model", status: "pending", version: "v2.0" },
  ];

  const dagEdges: DAGEdge[] = [
    { from: "data", to: "preprocess" },
    { from: "preprocess", to: "augment" },
    { from: "augment", to: "train" },
    { from: "train", to: "eval" },
    { from: "eval", to: "model" },
  ];

  // Model layers config
  const modelLayers = [
    { id: "l1", type: "dense" as const, params: { units: 256, activation: "relu" } },
    { id: "l2", type: "batchnorm" as const, params: {} },
    { id: "l3", type: "dropout" as const, params: { rate: 0.3 } },
    { id: "l4", type: "dense" as const, params: { units: 128, activation: "relu" } },
    { id: "l5", type: "batchnorm" as const, params: {} },
    { id: "l6", type: "dropout" as const, params: { rate: 0.2 } },
    { id: "l7", type: "dense" as const, params: { units: 10, activation: "softmax" } },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML Simulator</h1>
          <p className="text-muted-foreground mt-2">
            Interactive neural network and quantum machine learning simulation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => training.setIsRunning(!training.isRunning)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors",
              training.isRunning
                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {training.isRunning ? (
              <>
                <Pause className="h-4 w-4" /> Stop Training
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Start Training
              </>
            )}
          </button>
          <button
            onClick={training.reset}
            className="p-2 border border-border rounded-md hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Training Progress */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Epoch</div>
            <div className="text-2xl font-bold font-mono">
              {training.currentEpoch}/{trainingConfig.epochs}
            </div>
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(training.currentEpoch / trainingConfig.epochs) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Loss</div>
            <div className="text-2xl font-bold font-mono text-red-500">
              {training.currentState?.loss.toFixed(4) || "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Accuracy</div>
            <div className="text-2xl font-bold font-mono text-green-500">
              {training.currentState ? `${(training.currentState.accuracy * 100).toFixed(1)}%` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Learning Rate</div>
            <div className="text-2xl font-bold font-mono">
              {training.currentState?.learningRate.toExponential(2) || "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Grad Norm</div>
            <div className="text-2xl font-bold font-mono">
              {training.currentState?.gradientNorm.toFixed(4) || "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="neural" className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> Neural Network
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Training Curves
          </TabsTrigger>
          <TabsTrigger value="embeddings" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Embeddings
          </TabsTrigger>
          <TabsTrigger value="quantum" className="flex items-center gap-2">
            <Atom className="h-4 w-4" /> Quantum ML
          </TabsTrigger>
          <TabsTrigger value="physics" className="flex items-center gap-2">
            <Zap className="h-4 w-4" /> Physics
          </TabsTrigger>
          <TabsTrigger value="lineage" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Lineage
          </TabsTrigger>
        </TabsList>

        {/* Neural Network Tab */}
        <TabsContent value="neural" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Network Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <NeuralNetworkVisualizer
                  layers={layers}
                  activations={activations}
                  layerNames={["Input", "Hidden 1", "Hidden 2", "Hidden 3", "Output"]}
                  animated={training.isRunning}
                  maxHeight={280}
                />
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Layer Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelArchitectureBuilder layers={modelLayers} readOnly />
              </CardContent>
            </Card>
          </div>

          {/* Confusion Matrix */}
          {training.currentEpoch > 10 && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Confusion Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <Heatmap
                  data={confusionMatrix}
                  xLabels={Array.from({ length: 10 }, (_, i) => `${i}`)}
                  yLabels={Array.from({ length: 10 }, (_, i) => `${i}`)}
                  colorScale="viridis"
                  height={250}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Training Curves Tab */}
        <TabsContent value="training" className="mt-4 space-y-4">
          <div className="flex items-center justify-end">
            <SmoothingSlider value={smoothing} onChange={setSmoothing} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricChart
                  data={chartData}
                  lines={[
                    { key: "loss", name: "Train Loss", color: "#ef4444" },
                    { key: "valLoss", name: "Val Loss", color: "#f97316", dashed: true },
                  ]}
                  xKey="epoch"
                  height={250}
                  smoothing={smoothing}
                  syncId="training"
                />
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricChart
                  data={chartData}
                  lines={[
                    { key: "accuracy", name: "Train Acc", color: "#22c55e" },
                    { key: "valAccuracy", name: "Val Acc", color: "#84cc16", dashed: true },
                  ]}
                  xKey="epoch"
                  height={250}
                  smoothing={smoothing}
                  syncId="training"
                />
              </CardContent>
            </Card>

            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>Learning Rate Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricChart
                  data={chartData}
                  lines={[
                    { key: "lr", name: "Learning Rate (×1000)", color: "#6366f1" },
                  ]}
                  xKey="epoch"
                  height={200}
                  showBrush
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Embeddings Tab */}
        <TabsContent value="embeddings" className="mt-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">t-SNE Embedding Visualization</CardTitle>
              <p className="text-sm text-muted-foreground">
                Watch how class clusters form as training progresses
              </p>
            </CardHeader>
            <CardContent>
              <AdvancedScatterPlot
                data={scatterData}
                xLabel="Dimension 1"
                yLabel="Dimension 2"
                showRegression={false}
                height={350}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quantum ML Tab */}
        <TabsContent value="quantum" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quantum Circuit Simulator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Simulate quantum gates and observe state evolution
              </p>
            </CardHeader>
            <CardContent>
              <QuantumSimulator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Physics Tab */}
        <TabsContent value="physics" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gradient Descent Visualization</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Parameters navigating the loss landscape
                </p>
              </CardHeader>
              <CardContent>
                <PhysicsVisualization
                  particles={particles}
                  width={350}
                  height={220}
                  gravity={0.05}
                  friction={0.98}
                  running={training.isRunning}
                  onUpdate={setParticles}
                />
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Loss Landscape Cross-Section</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedScatterPlot
                  data={Array.from({ length: 100 }, (_, i) => {
                    const x = (i - 50) / 10;
                    const y = Math.pow(x, 2) + Math.sin(x * 3) * 0.5 + (Math.random() - 0.5) * 0.2;
                    return {
                      id: `l${i}`,
                      x,
                      y,
                      category: "Loss Surface",
                    };
                  })}
                  xLabel="Parameter θ"
                  yLabel="Loss L(θ)"
                  showRegression={false}
                  height={220}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Optimizer Trajectory Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Heatmap
                data={Array.from({ length: 20 }, (_, i) =>
                  Array.from({ length: 20 }, (_, j) => {
                    const x = (i - 10) / 5;
                    const y = (j - 10) / 5;
                    return Math.pow(x, 2) + Math.pow(y, 2) + Math.sin(x * y) * 0.5;
                  })
                )}
                colorScale="plasma"
                title="2D Loss Surface"
                showValues={false}
                height={280}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lineage Tab */}
        <TabsContent value="lineage" className="mt-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Model Lineage & Artifacts</CardTitle>
              <p className="text-xs text-muted-foreground">
                Track data flow and model versions
              </p>
            </CardHeader>
            <CardContent>
              <DAGGraph
                nodes={dagNodes}
                edges={dagEdges}
                selectedNodeId={training.isRunning ? "train" : undefined}
                maxHeight={280}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

