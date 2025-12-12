/**
 * Cached Storage Layer
 *
 * Wraps the storage layer with intelligent caching for optimal performance.
 * Provides automatic cache invalidation on writes.
 */

import { IStorage } from "./storage";
import { cache, CacheKeys, CacheTTL } from "./cache";
import type {
  User, InsertUser,
  Model, InsertModel,
  Experiment, InsertExperiment,
  Feature, InsertFeature,
  Pipeline, InsertPipeline,
  PipelineStep, InsertPipelineStep,
  LabelingTask, InsertLabelingTask,
  Label, InsertLabel,
  Prediction, InsertPrediction,
  ApiKey, InsertApiKey,
  Alert, InsertAlert,
  UserSettings,
} from "@shared/schema";

export class CachedStorage implements IStorage {
  constructor(private storage: IStorage) {}

  // ==================== Users ====================

  async getUser(id: string): Promise<User | undefined> {
    return cache.getOrFetch(
      CacheKeys.user(id),
      () => this.storage.getUser(id),
      { ttl: CacheTTL.MEDIUM, tags: ["users"] }
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return cache.getOrFetch(
      CacheKeys.userByUsername(username),
      () => this.storage.getUserByUsername(username),
      { ttl: CacheTTL.MEDIUM, tags: ["users"] }
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return cache.getOrFetch(
      `user:email:${email}`,
      () => this.storage.getUserByEmail(email),
      { ttl: CacheTTL.MEDIUM, tags: ["users"] }
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.storage.createUser(user);
    // Warm cache with new user
    cache.set(CacheKeys.user(result.id), result, { ttl: CacheTTL.MEDIUM, tags: ["users"] });
    cache.set(CacheKeys.userByUsername(result.username), result, { ttl: CacheTTL.MEDIUM, tags: ["users"] });
    return result;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const result = await this.storage.updateUser(id, data);
    if (result) {
      // Invalidate and update cache
      cache.delete(CacheKeys.user(id));
      cache.invalidateByTag("users");
      cache.set(CacheKeys.user(id), result, { ttl: CacheTTL.MEDIUM, tags: ["users"] });
    }
    return result;
  }

  // ==================== Models ====================

  async getModels(): Promise<Model[]> {
    return cache.getOrFetch(
      CacheKeys.models(),
      () => this.storage.getModels(),
      { ttl: CacheTTL.SHORT, tags: ["models"] }
    );
  }

  async getModel(id: string): Promise<Model | undefined> {
    return cache.getOrFetch(
      CacheKeys.model(id),
      () => this.storage.getModel(id),
      { ttl: CacheTTL.MEDIUM, tags: ["models"] }
    );
  }

  async createModel(model: InsertModel): Promise<Model> {
    const result = await this.storage.createModel(model);
    cache.invalidateByTag("models");
    cache.set(CacheKeys.model(result.id), result, { ttl: CacheTTL.MEDIUM, tags: ["models"] });
    // Also invalidate dashboard stats
    cache.delete(CacheKeys.dashboardStats());
    return result;
  }

  async updateModel(id: string, data: Partial<Model>): Promise<Model | undefined> {
    const result = await this.storage.updateModel(id, data);
    if (result) {
      cache.invalidateByTag("models");
      cache.set(CacheKeys.model(id), result, { ttl: CacheTTL.MEDIUM, tags: ["models"] });
      cache.delete(CacheKeys.dashboardStats());
    }
    return result;
  }

  async deleteModel(id: string): Promise<boolean> {
    const result = await this.storage.deleteModel(id);
    if (result) {
      cache.invalidateByTag("models");
      cache.delete(CacheKeys.dashboardStats());
    }
    return result;
  }

  // ==================== Experiments ====================

  async getExperiments(): Promise<Experiment[]> {
    return cache.getOrFetch(
      CacheKeys.experiments(),
      () => this.storage.getExperiments(),
      { ttl: CacheTTL.SHORT, tags: ["experiments"] }
    );
  }

  async getExperiment(id: string): Promise<Experiment | undefined> {
    return cache.getOrFetch(
      CacheKeys.experiment(id),
      () => this.storage.getExperiment(id),
      { ttl: CacheTTL.MEDIUM, tags: ["experiments"] }
    );
  }

  async createExperiment(experiment: InsertExperiment): Promise<Experiment> {
    const result = await this.storage.createExperiment(experiment);
    cache.invalidateByTag("experiments");
    cache.set(CacheKeys.experiment(result.id), result, { ttl: CacheTTL.MEDIUM, tags: ["experiments"] });
    return result;
  }

  async updateExperiment(id: string, data: Partial<Experiment>): Promise<Experiment | undefined> {
    const result = await this.storage.updateExperiment(id, data);
    if (result) {
      cache.invalidateByTag("experiments");
      cache.set(CacheKeys.experiment(id), result, { ttl: CacheTTL.MEDIUM, tags: ["experiments"] });
    }
    return result;
  }

  async deleteExperiment(id: string): Promise<boolean> {
    const result = await this.storage.deleteExperiment(id);
    if (result) {
      cache.invalidateByTag("experiments");
    }
    return result;
  }

  // ==================== Features ====================

  async getFeatures(): Promise<Feature[]> {
    return cache.getOrFetch(
      CacheKeys.features(),
      () => this.storage.getFeatures(),
      { ttl: CacheTTL.MEDIUM, tags: ["features"] }
    );
  }

  async getFeature(id: string): Promise<Feature | undefined> {
    return cache.getOrFetch(
      CacheKeys.feature(id),
      () => this.storage.getFeature(id),
      { ttl: CacheTTL.MEDIUM, tags: ["features"] }
    );
  }

  async createFeature(feature: InsertFeature): Promise<Feature> {
    const result = await this.storage.createFeature(feature);
    cache.invalidateByTag("features");
    cache.set(CacheKeys.feature(result.id), result, { ttl: CacheTTL.MEDIUM, tags: ["features"] });
    return result;
  }

  async updateFeature(id: string, data: Partial<Feature>): Promise<Feature | undefined> {
    const result = await this.storage.updateFeature(id, data);
    if (result) {
      cache.invalidateByTag("features");
      cache.set(CacheKeys.feature(id), result, { ttl: CacheTTL.MEDIUM, tags: ["features"] });
    }
    return result;
  }

  async deleteFeature(id: string): Promise<boolean> {
    const result = await this.storage.deleteFeature(id);
    if (result) {
      cache.invalidateByTag("features");
    }
    return result;
  }

  // ==================== Pipelines ====================

  async getPipelines(): Promise<Pipeline[]> {
    return cache.getOrFetch(
      CacheKeys.pipelines(),
      () => this.storage.getPipelines(),
      { ttl: CacheTTL.SHORT, tags: ["pipelines"] }
    );
  }

  async getPipeline(id: string): Promise<Pipeline | undefined> {
    return cache.getOrFetch(
      CacheKeys.pipeline(id),
      () => this.storage.getPipeline(id),
      { ttl: CacheTTL.MEDIUM, tags: ["pipelines"] }
    );
  }

  async createPipeline(pipeline: InsertPipeline): Promise<Pipeline> {
    const result = await this.storage.createPipeline(pipeline);
    cache.invalidateByTag("pipelines");
    cache.set(CacheKeys.pipeline(result.id), result, { ttl: CacheTTL.MEDIUM, tags: ["pipelines"] });
    return result;
  }

  async updatePipeline(id: string, data: Partial<Pipeline>): Promise<Pipeline | undefined> {
    const result = await this.storage.updatePipeline(id, data);
    if (result) {
      cache.invalidateByTag("pipelines");
      cache.set(CacheKeys.pipeline(id), result, { ttl: CacheTTL.MEDIUM, tags: ["pipelines"] });
    }
    return result;
  }

  async deletePipeline(id: string): Promise<boolean> {
    const result = await this.storage.deletePipeline(id);
    if (result) {
      cache.invalidateByTag("pipelines");
    }
    return result;
  }

  // ==================== Pipeline Steps ====================

  async getPipelineSteps(pipelineId: string): Promise<PipelineStep[]> {
    return cache.getOrFetch(
      CacheKeys.pipelineSteps(pipelineId),
      () => this.storage.getPipelineSteps(pipelineId),
      { ttl: CacheTTL.SHORT, tags: ["pipeline-steps", `pipeline:${pipelineId}`] }
    );
  }

  async createPipelineStep(step: InsertPipelineStep): Promise<PipelineStep> {
    const result = await this.storage.createPipelineStep(step);
    cache.invalidateByTag("pipeline-steps");
    cache.delete(CacheKeys.pipelineSteps(step.pipelineId));
    return result;
  }

  async updatePipelineStep(id: string, data: Partial<PipelineStep>): Promise<PipelineStep | undefined> {
    const result = await this.storage.updatePipelineStep(id, data);
    if (result) {
      cache.invalidateByTag("pipeline-steps");
      cache.delete(CacheKeys.pipelineSteps(result.pipelineId));
    }
    return result;
  }

  // ==================== Labeling Tasks ====================

  async getLabelingTasks(): Promise<LabelingTask[]> {
    return cache.getOrFetch(
      "labeling:tasks",
      () => this.storage.getLabelingTasks(),
      { ttl: CacheTTL.MEDIUM, tags: ["labeling"] }
    );
  }

  async getLabelingTask(id: string): Promise<LabelingTask | undefined> {
    return cache.getOrFetch(
      `labeling:task:${id}`,
      () => this.storage.getLabelingTask(id),
      { ttl: CacheTTL.MEDIUM, tags: ["labeling"] }
    );
  }

  async createLabelingTask(task: InsertLabelingTask): Promise<LabelingTask> {
    const result = await this.storage.createLabelingTask(task);
    cache.invalidateByTag("labeling");
    return result;
  }

  async updateLabelingTask(id: string, data: Partial<LabelingTask>): Promise<LabelingTask | undefined> {
    const result = await this.storage.updateLabelingTask(id, data);
    if (result) {
      cache.invalidateByTag("labeling");
    }
    return result;
  }

  // ==================== Labels ====================

  async getLabels(taskId: string): Promise<Label[]> {
    return cache.getOrFetch(
      `labels:task:${taskId}`,
      () => this.storage.getLabels(taskId),
      { ttl: CacheTTL.SHORT, tags: ["labels", `task:${taskId}`] }
    );
  }

  async createLabel(label: InsertLabel): Promise<Label> {
    const result = await this.storage.createLabel(label);
    cache.delete(`labels:task:${label.taskId}`);
    cache.invalidateByTag("labels");
    return result;
  }

  // ==================== Predictions ====================

  async getPredictions(userId?: string): Promise<Prediction[]> {
    const key = userId ? `predictions:user:${userId}` : "predictions:all";
    return cache.getOrFetch(
      key,
      () => this.storage.getPredictions(userId),
      { ttl: CacheTTL.SHORT, tags: ["predictions"] }
    );
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const result = await this.storage.createPrediction(prediction);
    cache.invalidateByTag("predictions");
    cache.delete(CacheKeys.dashboardStats());
    return result;
  }

  // ==================== Alerts ====================

  async getAlerts(userId?: string): Promise<Alert[]> {
    const key = userId ? CacheKeys.alerts(userId) : "alerts:all";
    return cache.getOrFetch(
      key,
      () => this.storage.getAlerts(userId),
      { ttl: CacheTTL.SHORT, tags: ["alerts"] }
    );
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await this.storage.createAlert(alert);
    cache.invalidateByTag("alerts");
    cache.delete(CacheKeys.dashboardStats());
    return result;
  }

  async markAlertRead(id: string): Promise<Alert | undefined> {
    const result = await this.storage.markAlertRead(id);
    if (result) {
      cache.invalidateByTag("alerts");
      cache.delete(CacheKeys.dashboardStats());
    }
    return result;
  }

  // ==================== API Keys ====================

  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return cache.getOrFetch(
      `apikeys:user:${userId}`,
      () => this.storage.getApiKeys(userId),
      { ttl: CacheTTL.LONG, tags: ["apikeys", `user:${userId}`] }
    );
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const result = await this.storage.createApiKey(apiKey);
    cache.delete(`apikeys:user:${apiKey.userId}`);
    return result;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const result = await this.storage.deleteApiKey(id);
    if (result) {
      cache.invalidateByTag("apikeys");
    }
    return result;
  }

  // ==================== User Settings ====================

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return cache.getOrFetch(
      CacheKeys.userSettings(userId),
      () => this.storage.getUserSettings(userId),
      { ttl: CacheTTL.LONG, tags: ["settings", `user:${userId}`] }
    );
  }

  async updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    const result = await this.storage.updateUserSettings(userId, data);
    cache.delete(CacheKeys.userSettings(userId));
    cache.set(CacheKeys.userSettings(userId), result, { ttl: CacheTTL.LONG, tags: ["settings", `user:${userId}`] });
    return result;
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(): Promise<any> {
    return cache.getOrFetch(
      CacheKeys.dashboardStats(),
      () => this.storage.getDashboardStats(),
      { ttl: CacheTTL.SHORT, staleTtl: CacheTTL.SHORT, tags: ["dashboard"] }
    );
  }

  // ==================== Cache Management ====================

  /**
   * Clear all caches
   */
  clearCache(): void {
    cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cache.getStats();
  }

  /**
   * Warm commonly accessed data
   */
  async warmCache(): Promise<void> {
    await cache.warm([
      { key: CacheKeys.models(), fetcher: () => this.storage.getModels() },
      { key: CacheKeys.experiments(), fetcher: () => this.storage.getExperiments() },
      { key: CacheKeys.pipelines(), fetcher: () => this.storage.getPipelines() },
      { key: CacheKeys.features(), fetcher: () => this.storage.getFeatures() },
      { key: CacheKeys.dashboardStats(), fetcher: () => this.storage.getDashboardStats() },
    ]);
  }
}

export default CachedStorage;

