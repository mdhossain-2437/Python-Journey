import {
  type User, type InsertUser,
  type Model, type InsertModel,
  type Experiment, type InsertExperiment,
  type Feature, type InsertFeature,
  type Pipeline, type InsertPipeline,
  type PipelineStep, type InsertPipelineStep,
  type PipelineRun,
  type LabelingTask, type InsertLabelingTask,
  type Label, type InsertLabel,
  type Prediction, type InsertPrediction,
  type ApiKey, type InsertApiKey,
  type Alert, type InsertAlert,
  type UserSettings,
  type Integration
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Models
  getModels(): Promise<Model[]>;
  getModel(id: string): Promise<Model | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: string, data: Partial<Model>): Promise<Model | undefined>;
  deleteModel(id: string): Promise<boolean>;

  // Experiments
  getExperiments(): Promise<Experiment[]>;
  getExperiment(id: string): Promise<Experiment | undefined>;
  createExperiment(experiment: InsertExperiment): Promise<Experiment>;
  updateExperiment(id: string, data: Partial<Experiment>): Promise<Experiment | undefined>;
  deleteExperiment(id: string): Promise<boolean>;

  // Features
  getFeatures(): Promise<Feature[]>;
  getFeature(id: string): Promise<Feature | undefined>;
  createFeature(feature: InsertFeature): Promise<Feature>;
  updateFeature(id: string, data: Partial<Feature>): Promise<Feature | undefined>;
  deleteFeature(id: string): Promise<boolean>;

  // Pipelines
  getPipelines(): Promise<Pipeline[]>;
  getPipeline(id: string): Promise<Pipeline | undefined>;
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined>;
  deletePipeline(id: string): Promise<boolean>;

  // Pipeline Steps
  getPipelineSteps(pipelineId: string): Promise<PipelineStep[]>;
  createPipelineStep(step: InsertPipelineStep): Promise<PipelineStep>;
  updatePipelineStep(id: string, data: Partial<PipelineStep>): Promise<PipelineStep | undefined>;

  // Labeling Tasks
  getLabelingTasks(): Promise<LabelingTask[]>;
  getLabelingTask(id: string): Promise<LabelingTask | undefined>;
  createLabelingTask(task: InsertLabelingTask): Promise<LabelingTask>;
  updateLabelingTask(id: string, data: Partial<LabelingTask>): Promise<LabelingTask | undefined>;

  // Labels
  getLabels(taskId: string): Promise<Label[]>;
  createLabel(label: InsertLabel): Promise<Label>;

  // Predictions
  getPredictions(userId?: string): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;

  // Alerts
  getAlerts(userId?: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertRead(id: string): Promise<Alert | undefined>;

  // API Keys
  getApiKeys(userId: string): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  deleteApiKey(id: string): Promise<boolean>;

  // User Settings
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings>;

  // Dashboard Stats
  getDashboardStats(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private models: Map<string, Model> = new Map();
  private experiments: Map<string, Experiment> = new Map();
  private features: Map<string, Feature> = new Map();
  private pipelines: Map<string, Pipeline> = new Map();
  private pipelineSteps: Map<string, PipelineStep> = new Map();
  private labelingTasks: Map<string, LabelingTask> = new Map();
  private labels: Map<string, Label> = new Map();
  private predictions: Map<string, Prediction> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private userSettings: Map<string, UserSettings> = new Map();

  constructor() {
    this.seedData();
  }

  private async seedData() {
    // Create demo user
    const hashedPassword = await bcrypt.hash("demo123", 10);
    const demoUser: User = {
      id: "user_demo",
      username: "demo",
      email: "demo@llmodel-forge.com",
      password: hashedPassword,
      name: "Demo User",
      role: "ML Engineer",
      team: "Data Science",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Seed models
    const seedModels: Model[] = [
      {
        id: "model_001",
        name: "fraud-detection-xgboost",
        version: "3.2.1",
        stage: "production",
        framework: "XGBoost",
        description: "Production fraud detection model for real-time transaction scoring",
        accuracy: 0.956,
        f1Score: 0.942,
        latency: 12,
        tags: ["fraud", "real-time", "critical"],
        authorId: demoUser.id,
        modelPath: "/models/fraud-detection/v3.2.1",
        configJson: { threshold: 0.5, max_depth: 10 },
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-10"),
      },
      {
        id: "model_002",
        name: "customer-churn-predictor",
        version: "2.0.0",
        stage: "staging",
        framework: "LightGBM",
        description: "Customer churn prediction model with SHAP explanations",
        accuracy: 0.891,
        f1Score: 0.876,
        latency: 8,
        tags: ["churn", "customer-analytics"],
        authorId: demoUser.id,
        modelPath: "/models/churn/v2.0.0",
        configJson: { num_leaves: 31 },
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-12"),
      },
      {
        id: "model_003",
        name: "sentiment-bert-large",
        version: "1.5.0",
        stage: "production",
        framework: "PyTorch",
        description: "BERT-based sentiment analysis for customer reviews",
        accuracy: 0.923,
        f1Score: 0.918,
        latency: 45,
        tags: ["nlp", "sentiment", "bert"],
        authorId: demoUser.id,
        modelPath: "/models/sentiment/v1.5.0",
        configJson: { max_length: 512 },
        createdAt: new Date("2023-12-20"),
        updatedAt: new Date("2024-01-28"),
      },
    ];
    seedModels.forEach(m => this.models.set(m.id, m));

    // Seed experiments
    const seedExperiments: Experiment[] = [
      {
        id: "exp_001",
        name: "XGBoost_Optimized_v1",
        description: "Hyperparameter optimization for fraud detection",
        status: "completed",
        modelId: "model_001",
        authorId: demoUser.id,
        hyperparameters: { max_depth: 10, learning_rate: 0.1, n_estimators: 100 },
        metrics: { accuracy: 0.942, f1: 0.92, auc: 0.95 },
        accuracy: 0.942,
        f1Score: 0.92,
        duration: "45m",
        epochsCompleted: 100,
        totalEpochs: 100,
        logs: ["Training started", "Epoch 50 completed", "Training completed"],
        createdAt: new Date("2024-02-10"),
        updatedAt: new Date("2024-02-10"),
      },
      {
        id: "exp_002",
        name: "BERT_FineTune_Base",
        description: "Fine-tuning BERT for sentiment analysis",
        status: "running",
        modelId: "model_003",
        authorId: demoUser.id,
        hyperparameters: { learning_rate: 2e-5, batch_size: 32, epochs: 5 },
        metrics: { accuracy: 0.912, f1: 0.89 },
        accuracy: 0.912,
        f1Score: 0.89,
        duration: "1h 20m",
        epochsCompleted: 3,
        totalEpochs: 5,
        logs: ["Training started", "Epoch 1 completed", "Epoch 2 completed", "Epoch 3 completed"],
        createdAt: new Date("2024-02-12"),
        updatedAt: new Date("2024-02-13"),
      },
    ];
    seedExperiments.forEach(e => this.experiments.set(e.id, e));

    // Seed features
    const seedFeatures: Feature[] = [
      {
        id: "fs_001",
        name: "user_avg_session_duration",
        description: "Average session duration per user over last 30 days",
        dataType: "float",
        entity: "user",
        status: "online",
        version: "1.0.0",
        sourceTable: "user_sessions",
        transformationSql: "SELECT user_id, AVG(duration) as value FROM sessions GROUP BY user_id",
        statistics: { mean: 45.2, std: 12.5, min: 5, max: 180 },
        authorId: demoUser.id,
        createdAt: new Date("2023-10-15"),
        updatedAt: new Date("2023-10-15"),
      },
      {
        id: "fs_002",
        name: "transaction_count_7d",
        description: "Number of transactions in last 7 days",
        dataType: "integer",
        entity: "transaction",
        status: "online",
        version: "1.0.0",
        sourceTable: "transactions",
        transformationSql: "SELECT user_id, COUNT(*) as value FROM transactions WHERE date > NOW() - INTERVAL '7 days' GROUP BY user_id",
        statistics: { mean: 12, std: 5, min: 0, max: 100 },
        authorId: demoUser.id,
        createdAt: new Date("2023-10-20"),
        updatedAt: new Date("2023-10-20"),
      },
      {
        id: "fs_003",
        name: "device_fingerprint_embedding",
        description: "768-dimensional embedding of device fingerprint",
        dataType: "vector<768>",
        entity: "device",
        status: "offline",
        version: "1.0.0",
        sourceTable: "device_data",
        transformationSql: null,
        statistics: null,
        authorId: demoUser.id,
        createdAt: new Date("2023-11-01"),
        updatedAt: new Date("2023-11-01"),
      },
    ];
    seedFeatures.forEach(f => this.features.set(f.id, f));

    // Seed pipelines
    const seedPipelines: Pipeline[] = [
      {
        id: "pipe_001",
        name: "fraud-detection-training",
        description: "End-to-end training pipeline for fraud detection model",
        status: "running",
        schedule: "Daily at 2:00 AM",
        triggerType: "scheduled",
        lastRunAt: new Date("2024-02-13T10:30:00"),
        nextRunAt: new Date("2024-02-14T02:00:00"),
        authorId: demoUser.id,
        config: { notifications: true, retry_count: 3 },
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-02-13"),
      },
      {
        id: "pipe_002",
        name: "churn-prediction-retrain",
        description: "Weekly retraining pipeline for customer churn model",
        status: "completed",
        schedule: "Weekly on Monday",
        triggerType: "scheduled",
        lastRunAt: new Date("2024-02-12T14:00:00"),
        nextRunAt: new Date("2024-02-19T14:00:00"),
        authorId: demoUser.id,
        config: { notifications: true },
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-12"),
      },
    ];
    seedPipelines.forEach(p => this.pipelines.set(p.id, p));

    // Seed pipeline steps
    const seedSteps: PipelineStep[] = [
      { id: "step_001", pipelineId: "pipe_001", name: "Data Ingestion", stepType: "data", status: "completed", order: 1, duration: "5m 23s", logs: [], config: {}, startedAt: new Date(), completedAt: new Date() },
      { id: "step_002", pipelineId: "pipe_001", name: "Feature Engineering", stepType: "data", status: "completed", order: 2, duration: "12m 45s", logs: [], config: {}, startedAt: new Date(), completedAt: new Date() },
      { id: "step_003", pipelineId: "pipe_001", name: "Model Training", stepType: "training", status: "running", order: 3, duration: "23m...", logs: [], config: {}, startedAt: new Date(), completedAt: null },
      { id: "step_004", pipelineId: "pipe_001", name: "Model Evaluation", stepType: "evaluation", status: "pending", order: 4, duration: null, logs: [], config: {}, startedAt: null, completedAt: null },
      { id: "step_005", pipelineId: "pipe_001", name: "Deploy to Staging", stepType: "deployment", status: "pending", order: 5, duration: null, logs: [], config: {}, startedAt: null, completedAt: null },
    ];
    seedSteps.forEach(s => this.pipelineSteps.set(s.id, s));

    // Seed alerts
    const seedAlerts: Alert[] = [
      {
        id: "alert_001",
        type: "drift",
        severity: "warning",
        message: "Data drift detected in fraud-detection model - feature 'transaction_amount' distribution shift",
        modelId: "model_001",
        pipelineId: null,
        isRead: false,
        userId: demoUser.id,
        createdAt: new Date("2024-02-13T10:30:00"),
      },
      {
        id: "alert_002",
        type: "pipeline",
        severity: "info",
        message: "Pipeline 'churn-prediction-retrain' completed successfully",
        modelId: null,
        pipelineId: "pipe_002",
        isRead: false,
        userId: demoUser.id,
        createdAt: new Date("2024-02-12T15:30:00"),
      },
    ];
    seedAlerts.forEach(a => this.alerts.set(a.id, a));

    // Seed labeling tasks
    const seedLabelingTasks: LabelingTask[] = [
      {
        id: "task_001",
        name: "Industrial Defect Detection",
        description: "Quality assurance labeling for manufacturing defects",
        datasetPath: "/datasets/industrial-images",
        totalItems: 2000,
        completedItems: 145,
        classes: [
          { id: 1, name: "Defect: Scratch", color: "bg-red-500" },
          { id: 2, name: "Defect: Dent", color: "bg-orange-500" },
          { id: 3, name: "Defect: Paint", color: "bg-yellow-500" },
          { id: 4, name: "No Defect", color: "bg-green-500" },
        ],
        authorId: demoUser.id,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-13"),
      },
    ];
    seedLabelingTasks.forEach(t => this.labelingTasks.set(t.id, t));

    // Seed user settings
    this.userSettings.set(demoUser.id, {
      id: "settings_demo",
      userId: demoUser.id,
      emailNotifications: true,
      slackNotifications: true,
      pipelineAlerts: true,
      modelDriftAlerts: true,
      weeklyDigest: false,
      darkMode: true,
      compactView: false,
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id,
      ...insertUser,
      password: hashedPassword,
      role: insertUser.role || "ML Engineer",
      team: insertUser.team || "Data Science",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  // Model methods
  async getModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }

  async getModel(id: string): Promise<Model | undefined> {
    return this.models.get(id);
  }

  async createModel(insertModel: InsertModel): Promise<Model> {
    const id = `model_${randomUUID().slice(0, 8)}`;
    const model: Model = {
      id,
      ...insertModel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.models.set(id, model);
    return model;
  }

  async updateModel(id: string, data: Partial<Model>): Promise<Model | undefined> {
    const model = this.models.get(id);
    if (!model) return undefined;
    const updated = { ...model, ...data, updatedAt: new Date() };
    this.models.set(id, updated);
    return updated;
  }

  async deleteModel(id: string): Promise<boolean> {
    return this.models.delete(id);
  }

  // Experiment methods
  async getExperiments(): Promise<Experiment[]> {
    return Array.from(this.experiments.values());
  }

  async getExperiment(id: string): Promise<Experiment | undefined> {
    return this.experiments.get(id);
  }

  async createExperiment(insertExp: InsertExperiment): Promise<Experiment> {
    const id = `exp_${randomUUID().slice(0, 8)}`;
    const experiment: Experiment = {
      id,
      ...insertExp,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.experiments.set(id, experiment);
    return experiment;
  }

  async updateExperiment(id: string, data: Partial<Experiment>): Promise<Experiment | undefined> {
    const exp = this.experiments.get(id);
    if (!exp) return undefined;
    const updated = { ...exp, ...data, updatedAt: new Date() };
    this.experiments.set(id, updated);
    return updated;
  }

  async deleteExperiment(id: string): Promise<boolean> {
    return this.experiments.delete(id);
  }

  // Feature methods
  async getFeatures(): Promise<Feature[]> {
    return Array.from(this.features.values());
  }

  async getFeature(id: string): Promise<Feature | undefined> {
    return this.features.get(id);
  }

  async createFeature(insertFeature: InsertFeature): Promise<Feature> {
    const id = `fs_${randomUUID().slice(0, 8)}`;
    const feature: Feature = {
      id,
      ...insertFeature,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.features.set(id, feature);
    return feature;
  }

  async updateFeature(id: string, data: Partial<Feature>): Promise<Feature | undefined> {
    const feature = this.features.get(id);
    if (!feature) return undefined;
    const updated = { ...feature, ...data, updatedAt: new Date() };
    this.features.set(id, updated);
    return updated;
  }

  async deleteFeature(id: string): Promise<boolean> {
    return this.features.delete(id);
  }

  // Pipeline methods
  async getPipelines(): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values());
  }

  async getPipeline(id: string): Promise<Pipeline | undefined> {
    return this.pipelines.get(id);
  }

  async createPipeline(insertPipeline: InsertPipeline): Promise<Pipeline> {
    const id = `pipe_${randomUUID().slice(0, 8)}`;
    const pipeline: Pipeline = {
      id,
      ...insertPipeline,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pipelines.set(id, pipeline);
    return pipeline;
  }

  async updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return undefined;
    const updated = { ...pipeline, ...data, updatedAt: new Date() };
    this.pipelines.set(id, updated);
    return updated;
  }

  async deletePipeline(id: string): Promise<boolean> {
    return this.pipelines.delete(id);
  }

  // Pipeline Step methods
  async getPipelineSteps(pipelineId: string): Promise<PipelineStep[]> {
    return Array.from(this.pipelineSteps.values())
      .filter(s => s.pipelineId === pipelineId)
      .sort((a, b) => a.order - b.order);
  }

  async createPipelineStep(insertStep: InsertPipelineStep): Promise<PipelineStep> {
    const id = `step_${randomUUID().slice(0, 8)}`;
    const step: PipelineStep = { id, ...insertStep };
    this.pipelineSteps.set(id, step);
    return step;
  }

  async updatePipelineStep(id: string, data: Partial<PipelineStep>): Promise<PipelineStep | undefined> {
    const step = this.pipelineSteps.get(id);
    if (!step) return undefined;
    const updated = { ...step, ...data };
    this.pipelineSteps.set(id, updated);
    return updated;
  }

  // Labeling Task methods
  async getLabelingTasks(): Promise<LabelingTask[]> {
    return Array.from(this.labelingTasks.values());
  }

  async getLabelingTask(id: string): Promise<LabelingTask | undefined> {
    return this.labelingTasks.get(id);
  }

  async createLabelingTask(insertTask: InsertLabelingTask): Promise<LabelingTask> {
    const id = `task_${randomUUID().slice(0, 8)}`;
    const task: LabelingTask = {
      id,
      ...insertTask,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.labelingTasks.set(id, task);
    return task;
  }

  async updateLabelingTask(id: string, data: Partial<LabelingTask>): Promise<LabelingTask | undefined> {
    const task = this.labelingTasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...data, updatedAt: new Date() };
    this.labelingTasks.set(id, updated);
    return updated;
  }

  // Label methods
  async getLabels(taskId: string): Promise<Label[]> {
    return Array.from(this.labels.values()).filter(l => l.taskId === taskId);
  }

  async createLabel(insertLabel: InsertLabel): Promise<Label> {
    const id = `label_${randomUUID().slice(0, 8)}`;
    const label: Label = {
      id,
      ...insertLabel,
      createdAt: new Date(),
    };
    this.labels.set(id, label);

    // Update task completed count
    const task = this.labelingTasks.get(insertLabel.taskId);
    if (task) {
      task.completedItems = (task.completedItems || 0) + 1;
      this.labelingTasks.set(insertLabel.taskId, task);
    }

    return label;
  }

  // Prediction methods
  async getPredictions(userId?: string): Promise<Prediction[]> {
    const preds = Array.from(this.predictions.values());
    if (userId) return preds.filter(p => p.userId === userId);
    return preds;
  }

  async createPrediction(insertPred: InsertPrediction): Promise<Prediction> {
    const id = `pred_${randomUUID().slice(0, 8)}`;
    const prediction: Prediction = {
      id,
      ...insertPred,
      createdAt: new Date(),
    };
    this.predictions.set(id, prediction);
    return prediction;
  }

  // Alert methods
  async getAlerts(userId?: string): Promise<Alert[]> {
    const alerts = Array.from(this.alerts.values());
    if (userId) return alerts.filter(a => a.userId === userId).sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
    return alerts;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = `alert_${randomUUID().slice(0, 8)}`;
    const alert: Alert = {
      id,
      ...insertAlert,
      createdAt: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async markAlertRead(id: string): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    alert.isRead = true;
    this.alerts.set(id, alert);
    return alert;
  }

  // API Key methods
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(k => k.userId === userId);
  }

  async createApiKey(insertKey: InsertApiKey): Promise<ApiKey> {
    const id = `key_${randomUUID().slice(0, 8)}`;
    const apiKey: ApiKey = {
      id,
      ...insertKey,
      lastUsedAt: null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      createdAt: new Date(),
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  // User Settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return this.userSettings.get(userId);
  }

  async updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    let settings = this.userSettings.get(userId);
    if (!settings) {
      settings = {
        id: randomUUID(),
        userId,
        emailNotifications: true,
        slackNotifications: false,
        pipelineAlerts: true,
        modelDriftAlerts: true,
        weeklyDigest: false,
        darkMode: true,
        compactView: false,
      };
    }
    const updated = { ...settings, ...data };
    this.userSettings.set(userId, updated);
    return updated;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<any> {
    const models = await this.getModels();
    const experiments = await this.getExperiments();
    const pipelines = await this.getPipelines();
    const alerts = Array.from(this.alerts.values());

    return {
      activeModels: models.filter(m => m.stage === "production").length,
      totalModels: models.length,
      totalPredictions: this.predictions.size,
      runningExperiments: experiments.filter(e => e.status === "running").length,
      completedExperiments: experiments.filter(e => e.status === "completed").length,
      runningPipelines: pipelines.filter(p => p.status === "running").length,
      avgLatency: Math.round(models.reduce((acc, m) => acc + (m.latency || 0), 0) / models.length) || 0,
      unreadAlerts: alerts.filter(a => !a.isRead).length,
      recentAlerts: alerts.slice(0, 5),
      systemStatus: "operational",
    };
  }
}

// Create base storage
const baseStorage = new MemStorage();

// Import cached storage wrapper (will be used when available)
import { CachedStorage } from "./cached-storage";

// Export cached storage for optimal performance
export const storage = new CachedStorage(baseStorage);

// Also export base storage for direct access if needed
export { baseStorage };
