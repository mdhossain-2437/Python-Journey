import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import { IStorage } from "./storage";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string) {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: schema.InsertUser) {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db.insert(schema.users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<schema.User>) {
    const result = await db.update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  // Model methods
  async getModels() {
    return db.select().from(schema.models).orderBy(desc(schema.models.updatedAt));
  }

  async getModel(id: string) {
    const result = await db.select().from(schema.models).where(eq(schema.models.id, id)).limit(1);
    return result[0];
  }

  async createModel(insertModel: schema.InsertModel) {
    const result = await db.insert(schema.models).values(insertModel).returning();
    return result[0];
  }

  async updateModel(id: string, data: Partial<schema.Model>) {
    const result = await db.update(schema.models)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.models.id, id))
      .returning();
    return result[0];
  }

  async deleteModel(id: string) {
    const result = await db.delete(schema.models).where(eq(schema.models.id, id)).returning();
    return result.length > 0;
  }

  // Experiment methods
  async getExperiments() {
    return db.select().from(schema.experiments).orderBy(desc(schema.experiments.updatedAt));
  }

  async getExperiment(id: string) {
    const result = await db.select().from(schema.experiments).where(eq(schema.experiments.id, id)).limit(1);
    return result[0];
  }

  async createExperiment(insertExp: schema.InsertExperiment) {
    const result = await db.insert(schema.experiments).values(insertExp).returning();
    return result[0];
  }

  async updateExperiment(id: string, data: Partial<schema.Experiment>) {
    const result = await db.update(schema.experiments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.experiments.id, id))
      .returning();
    return result[0];
  }

  async deleteExperiment(id: string) {
    const result = await db.delete(schema.experiments).where(eq(schema.experiments.id, id)).returning();
    return result.length > 0;
  }

  // Feature methods
  async getFeatures() {
    return db.select().from(schema.features).orderBy(desc(schema.features.updatedAt));
  }

  async getFeature(id: string) {
    const result = await db.select().from(schema.features).where(eq(schema.features.id, id)).limit(1);
    return result[0];
  }

  async createFeature(insertFeature: schema.InsertFeature) {
    const result = await db.insert(schema.features).values(insertFeature).returning();
    return result[0];
  }

  async updateFeature(id: string, data: Partial<schema.Feature>) {
    const result = await db.update(schema.features)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.features.id, id))
      .returning();
    return result[0];
  }

  async deleteFeature(id: string) {
    const result = await db.delete(schema.features).where(eq(schema.features.id, id)).returning();
    return result.length > 0;
  }

  // Pipeline methods
  async getPipelines() {
    return db.select().from(schema.pipelines).orderBy(desc(schema.pipelines.updatedAt));
  }

  async getPipeline(id: string) {
    const result = await db.select().from(schema.pipelines).where(eq(schema.pipelines.id, id)).limit(1);
    return result[0];
  }

  async createPipeline(insertPipeline: schema.InsertPipeline) {
    const result = await db.insert(schema.pipelines).values(insertPipeline).returning();
    return result[0];
  }

  async updatePipeline(id: string, data: Partial<schema.Pipeline>) {
    const result = await db.update(schema.pipelines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.pipelines.id, id))
      .returning();
    return result[0];
  }

  async deletePipeline(id: string) {
    const result = await db.delete(schema.pipelines).where(eq(schema.pipelines.id, id)).returning();
    return result.length > 0;
  }

  // Pipeline Step methods
  async getPipelineSteps(pipelineId: string) {
    return db.select()
      .from(schema.pipelineSteps)
      .where(eq(schema.pipelineSteps.pipelineId, pipelineId))
      .orderBy(schema.pipelineSteps.order);
  }

  async createPipelineStep(insertStep: schema.InsertPipelineStep) {
    const result = await db.insert(schema.pipelineSteps).values(insertStep).returning();
    return result[0];
  }

  async updatePipelineStep(id: string, data: Partial<schema.PipelineStep>) {
    const result = await db.update(schema.pipelineSteps)
      .set(data)
      .where(eq(schema.pipelineSteps.id, id))
      .returning();
    return result[0];
  }

  // Labeling Task methods
  async getLabelingTasks() {
    return db.select().from(schema.labelingTasks).orderBy(desc(schema.labelingTasks.updatedAt));
  }

  async getLabelingTask(id: string) {
    const result = await db.select().from(schema.labelingTasks).where(eq(schema.labelingTasks.id, id)).limit(1);
    return result[0];
  }

  async createLabelingTask(insertTask: schema.InsertLabelingTask) {
    const result = await db.insert(schema.labelingTasks).values(insertTask).returning();
    return result[0];
  }

  async updateLabelingTask(id: string, data: Partial<schema.LabelingTask>) {
    const result = await db.update(schema.labelingTasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.labelingTasks.id, id))
      .returning();
    return result[0];
  }

  // Label methods
  async getLabels(taskId: string) {
    return db.select().from(schema.labels).where(eq(schema.labels.taskId, taskId));
  }

  async createLabel(insertLabel: schema.InsertLabel) {
    const result = await db.insert(schema.labels).values(insertLabel).returning();

    // Update task completed count
    await db.execute(`
      UPDATE labeling_tasks 
      SET completed_items = completed_items + 1, updated_at = NOW()
      WHERE id = '${insertLabel.taskId}'
    `);

    return result[0];
  }

  // Prediction methods
  async getPredictions(userId?: string) {
    if (userId) {
      return db.select()
        .from(schema.predictions)
        .where(eq(schema.predictions.userId, userId))
        .orderBy(desc(schema.predictions.createdAt));
    }
    return db.select().from(schema.predictions).orderBy(desc(schema.predictions.createdAt));
  }

  async createPrediction(insertPred: schema.InsertPrediction) {
    const result = await db.insert(schema.predictions).values(insertPred).returning();
    return result[0];
  }

  // Alert methods
  async getAlerts(userId?: string) {
    if (userId) {
      return db.select()
        .from(schema.alerts)
        .where(eq(schema.alerts.userId, userId))
        .orderBy(desc(schema.alerts.createdAt));
    }
    return db.select().from(schema.alerts).orderBy(desc(schema.alerts.createdAt));
  }

  async createAlert(insertAlert: schema.InsertAlert) {
    const result = await db.insert(schema.alerts).values(insertAlert).returning();
    return result[0];
  }

  async markAlertRead(id: string) {
    const result = await db.update(schema.alerts)
      .set({ isRead: true })
      .where(eq(schema.alerts.id, id))
      .returning();
    return result[0];
  }

  // API Key methods
  async getApiKeys(userId: string) {
    return db.select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.userId, userId))
      .orderBy(desc(schema.apiKeys.createdAt));
  }

  async createApiKey(insertKey: schema.InsertApiKey) {
    const result = await db.insert(schema.apiKeys).values(insertKey).returning();
    return result[0];
  }

  async deleteApiKey(id: string) {
    const result = await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id)).returning();
    return result.length > 0;
  }

  // User Settings methods
  async getUserSettings(userId: string) {
    const result = await db.select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId))
      .limit(1);
    return result[0];
  }

  async updateUserSettings(userId: string, data: Partial<schema.UserSettings>) {
    const existing = await this.getUserSettings(userId);

    if (existing) {
      const result = await db.update(schema.userSettings)
        .set(data)
        .where(eq(schema.userSettings.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(schema.userSettings)
        .values({ userId, ...data })
        .returning();
      return result[0];
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    const models = await this.getModels();
    const experiments = await this.getExperiments();
    const pipelines = await this.getPipelines();
    const alerts = await this.getAlerts();
    const predictions = await this.getPredictions();

    return {
      activeModels: models.filter(m => m.stage === "production").length,
      totalModels: models.length,
      totalPredictions: predictions.length,
      runningExperiments: experiments.filter(e => e.status === "running").length,
      completedExperiments: experiments.filter(e => e.status === "completed").length,
      runningPipelines: pipelines.filter(p => p.status === "running").length,
      avgLatency: Math.round(models.reduce((acc, m) => acc + (m.latency || 0), 0) / (models.length || 1)),
      unreadAlerts: alerts.filter(a => !a.isRead).length,
      recentAlerts: alerts.slice(0, 5),
      systemStatus: "operational",
    };
  }
}

