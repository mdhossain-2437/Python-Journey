import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Mock data for API endpoints
const models = [
  {
    id: "model_001",
    name: "fraud-detection-xgboost",
    version: "3.2.1",
    stage: "production",
    framework: "XGBoost",
    metrics: { accuracy: 0.956, f1Score: 0.942, latency: 12 },
    author: "Jane Smith",
    createdAt: "2024-01-15",
    lastUpdated: "2024-02-10",
    description: "Production fraud detection model for real-time transaction scoring",
    tags: ["fraud", "real-time", "critical"]
  },
  {
    id: "model_002",
    name: "customer-churn-predictor",
    version: "2.0.0",
    stage: "staging",
    framework: "LightGBM",
    metrics: { accuracy: 0.891, f1Score: 0.876, latency: 8 },
    author: "John Doe",
    createdAt: "2024-02-01",
    lastUpdated: "2024-02-12",
    description: "Customer churn prediction model with SHAP explanations",
    tags: ["churn", "customer-analytics"]
  },
  {
    id: "model_003",
    name: "sentiment-bert-large",
    version: "1.5.0",
    stage: "production",
    framework: "PyTorch",
    metrics: { accuracy: 0.923, f1Score: 0.918, latency: 45 },
    author: "Alice Chen",
    createdAt: "2023-12-20",
    lastUpdated: "2024-01-28",
    description: "BERT-based sentiment analysis for customer reviews",
    tags: ["nlp", "sentiment", "bert"]
  },
];

const experiments = [
  { id: "exp_8921", name: "XGBoost_Optimized_v1", accuracy: 0.942, f1: 0.92, duration: "45m", status: "completed", date: "2024-02-10" },
  { id: "exp_8922", name: "ResNet50_Transfer", accuracy: 0.885, f1: 0.86, duration: "2h 15m", status: "failed", date: "2024-02-11" },
  { id: "exp_8923", name: "Bert_FineTune_Base", accuracy: 0.912, f1: 0.89, duration: "1h 20m", status: "completed", date: "2024-02-12" },
  { id: "exp_8924", name: "XGBoost_Optimized_v2", accuracy: 0.956, f1: 0.94, duration: "50m", status: "running", date: "2024-02-13" },
];

const features = [
  { id: "fs_001", name: "user_avg_session_duration", type: "float", entity: "user", status: "online", created: "2023-10-15" },
  { id: "fs_002", name: "transaction_count_7d", type: "integer", entity: "transaction", status: "online", created: "2023-10-20" },
  { id: "fs_003", name: "device_fingerprint_embedding", type: "vector<768>", entity: "device", status: "offline", created: "2023-11-01" },
  { id: "fs_004", name: "last_login_geo", type: "geopoint", entity: "user", status: "online", created: "2023-11-05" },
  { id: "fs_005", name: "product_category_affinity", type: "json", entity: "user", status: "archived", created: "2023-09-12" },
];

const dashboardStats = {
  activeModels: 12,
  totalPredictions: "1.2M",
  avgLatency: "45ms",
  dataDrift: 0.03,
  systemStatus: "operational",
  alerts: [
    { id: 1, type: "warning", message: "Data drift detected in fraud-detection model", timestamp: "2024-02-13T10:30:00Z" },
    { id: 2, type: "info", message: "New model version available for sentiment-bert", timestamp: "2024-02-13T09:15:00Z" },
  ]
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", (_req, res) => {
    res.json(dashboardStats);
  });

  // Models API
  app.get("/api/models", (_req, res) => {
    res.json(models);
  });

  app.get("/api/models/:id", (req, res) => {
    const model = models.find(m => m.id === req.params.id);
    if (!model) {
      return res.status(404).json({ error: "Model not found" });
    }
    res.json(model);
  });

  app.post("/api/models", (req, res) => {
    const newModel = {
      id: `model_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    models.push(newModel);
    res.status(201).json(newModel);
  });

  app.patch("/api/models/:id", (req, res) => {
    const modelIndex = models.findIndex(m => m.id === req.params.id);
    if (modelIndex === -1) {
      return res.status(404).json({ error: "Model not found" });
    }
    models[modelIndex] = { ...models[modelIndex], ...req.body, lastUpdated: new Date().toISOString().split('T')[0] };
    res.json(models[modelIndex]);
  });

  app.delete("/api/models/:id", (req, res) => {
    const modelIndex = models.findIndex(m => m.id === req.params.id);
    if (modelIndex === -1) {
      return res.status(404).json({ error: "Model not found" });
    }
    models.splice(modelIndex, 1);
    res.status(204).send();
  });

  // Experiments API
  app.get("/api/experiments", (_req, res) => {
    res.json(experiments);
  });

  app.get("/api/experiments/:id", (req, res) => {
    const experiment = experiments.find(e => e.id === req.params.id);
    if (!experiment) {
      return res.status(404).json({ error: "Experiment not found" });
    }
    res.json(experiment);
  });

  app.post("/api/experiments", (req, res) => {
    const newExperiment = {
      id: `exp_${Date.now()}`,
      ...req.body,
      date: new Date().toISOString().split('T')[0],
      status: "running",
    };
    experiments.push(newExperiment);
    res.status(201).json(newExperiment);
  });

  // Features API
  app.get("/api/features", (_req, res) => {
    res.json(features);
  });

  app.get("/api/features/:id", (req, res) => {
    const feature = features.find(f => f.id === req.params.id);
    if (!feature) {
      return res.status(404).json({ error: "Feature not found" });
    }
    res.json(feature);
  });

  app.post("/api/features", (req, res) => {
    const newFeature = {
      id: `fs_${Date.now()}`,
      ...req.body,
      created: new Date().toISOString().split('T')[0],
      status: "staging",
    };
    features.push(newFeature);
    res.status(201).json(newFeature);
  });

  // Simulator/Prediction API
  app.post("/api/predict", (req, res) => {
    const { creditScore, annualIncome, debtToIncome, age, loanAmount } = req.body;

    // Simple mock prediction logic
    let score = 0.5;
    if (creditScore > 700) score += 0.2;
    if (annualIncome > 50000) score += 0.1;
    if (debtToIncome < 40) score += 0.1;
    if (age > 25 && age < 60) score += 0.05;
    if (loanAmount < annualIncome * 0.3) score += 0.05;

    // Add some randomness
    score = Math.min(1, Math.max(0, score + (Math.random() - 0.5) * 0.1));

    const risk = score > 0.7 ? "Low Risk" : score > 0.4 ? "Moderate Risk" : "High Risk";

    res.json({
      score: parseFloat(score.toFixed(3)),
      risk,
      confidence: parseFloat((0.85 + Math.random() * 0.1).toFixed(3)),
      factors: [
        { name: "Credit Score", impact: creditScore > 700 ? "positive" : "negative", weight: 0.35 },
        { name: "Annual Income", impact: annualIncome > 50000 ? "positive" : "neutral", weight: 0.25 },
        { name: "Debt-to-Income", impact: debtToIncome < 40 ? "positive" : "negative", weight: 0.20 },
        { name: "Age", impact: age > 25 && age < 60 ? "positive" : "neutral", weight: 0.10 },
        { name: "Loan Amount", impact: loanAmount < annualIncome * 0.3 ? "positive" : "negative", weight: 0.10 },
      ]
    });
  });

  return httpServer;
}
