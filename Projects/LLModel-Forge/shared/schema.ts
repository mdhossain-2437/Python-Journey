import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const modelStageEnum = pgEnum("model_stage", ["development", "staging", "production", "archived"]);
export const pipelineStatusEnum = pgEnum("pipeline_status", ["idle", "running", "completed", "failed"]);
export const stepStatusEnum = pgEnum("step_status", ["pending", "running", "completed", "failed"]);
export const featureStatusEnum = pgEnum("feature_status", ["online", "offline", "staging", "archived"]);
export const experimentStatusEnum = pgEnum("experiment_status", ["running", "completed", "failed", "stopped"]);

// Users Table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").default("ML Engineer"),
  team: text("team").default("Data Science"),
  avatarUrl: text("avatar_url"),
  provider: text("provider").default("email"), // 'email' | 'google' | 'github'
  providerId: text("provider_id"), // OAuth provider user ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Models Table
export const models = pgTable("models", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  version: text("version").notNull().default("1.0.0"),
  stage: modelStageEnum("stage").default("development"),
  framework: text("framework").notNull(),
  description: text("description"),
  accuracy: real("accuracy"),
  f1Score: real("f1_score"),
  latency: integer("latency"),
  tags: json("tags").$type<string[]>().default([]),
  authorId: varchar("author_id", { length: 36 }).references(() => users.id),
  modelPath: text("model_path"),
  configJson: json("config_json"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Experiments Table
export const experiments = pgTable("experiments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: experimentStatusEnum("status").default("running"),
  modelId: varchar("model_id", { length: 36 }).references(() => models.id),
  authorId: varchar("author_id", { length: 36 }).references(() => users.id),
  hyperparameters: json("hyperparameters"),
  metrics: json("metrics"),
  accuracy: real("accuracy"),
  f1Score: real("f1_score"),
  duration: text("duration"),
  epochsCompleted: integer("epochs_completed").default(0),
  totalEpochs: integer("total_epochs").default(10),
  logs: json("logs").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Features Table
export const features = pgTable("features", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  dataType: text("data_type").notNull(),
  entity: text("entity").notNull(),
  status: featureStatusEnum("status").default("staging"),
  version: text("version").default("1.0.0"),
  sourceTable: text("source_table"),
  transformationSql: text("transformation_sql"),
  statistics: json("statistics"),
  authorId: varchar("author_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pipelines Table
export const pipelines = pgTable("pipelines", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: pipelineStatusEnum("status").default("idle"),
  schedule: text("schedule"),
  triggerType: text("trigger_type").default("manual"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  authorId: varchar("author_id", { length: 36 }).references(() => users.id),
  config: json("config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pipeline Steps Table
export const pipelineSteps = pgTable("pipeline_steps", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  pipelineId: varchar("pipeline_id", { length: 36 }).references(() => pipelines.id).notNull(),
  name: text("name").notNull(),
  stepType: text("step_type").notNull(),
  status: stepStatusEnum("status").default("pending"),
  order: integer("order").notNull(),
  duration: text("duration"),
  logs: json("logs").$type<string[]>().default([]),
  config: json("config"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Pipeline Runs Table
export const pipelineRuns = pgTable("pipeline_runs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  pipelineId: varchar("pipeline_id", { length: 36 }).references(() => pipelines.id).notNull(),
  status: pipelineStatusEnum("status").default("running"),
  triggeredBy: varchar("triggered_by", { length: 36 }).references(() => users.id),
  duration: text("duration"),
  logs: json("logs").$type<string[]>().default([]),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Labeling Tasks Table
export const labelingTasks = pgTable("labeling_tasks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  datasetPath: text("dataset_path"),
  totalItems: integer("total_items").default(0),
  completedItems: integer("completed_items").default(0),
  classes: json("classes").$type<{ id: number; name: string; color: string }[]>(),
  authorId: varchar("author_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Labels Table
export const labels = pgTable("labels", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id", { length: 36 }).references(() => labelingTasks.id).notNull(),
  itemId: text("item_id").notNull(),
  classId: integer("class_id").notNull(),
  labeledBy: varchar("labeled_by", { length: 36 }).references(() => users.id),
  confidence: real("confidence"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Predictions Table (for score simulator history)
export const predictions = pgTable("predictions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar("model_id", { length: 36 }).references(() => models.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  inputs: json("inputs").notNull(),
  outputs: json("outputs").notNull(),
  score: real("score"),
  risk: text("risk"),
  latency: integer("latency"),
  createdAt: timestamp("created_at").defaultNow(),
});

// API Keys Table
export const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  environment: text("environment").default("development"),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alerts Table
export const alerts = pgTable("alerts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  severity: text("severity").default("info"),
  message: text("message").notNull(),
  modelId: varchar("model_id", { length: 36 }).references(() => models.id),
  pipelineId: varchar("pipeline_id", { length: 36 }).references(() => pipelines.id),
  isRead: boolean("is_read").default(false),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings Table
export const userSettings = pgTable("user_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull().unique(),
  emailNotifications: boolean("email_notifications").default(true),
  slackNotifications: boolean("slack_notifications").default(false),
  pipelineAlerts: boolean("pipeline_alerts").default(true),
  modelDriftAlerts: boolean("model_drift_alerts").default(true),
  weeklyDigest: boolean("weekly_digest").default(false),
  darkMode: boolean("dark_mode").default(true),
  compactView: boolean("compact_view").default(false),
});

// Integrations Table
export const integrations = pgTable("integrations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  provider: text("provider").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  metadata: json("metadata"),
  isConnected: boolean("is_connected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertModelSchema = createInsertSchema(models).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExperimentSchema = createInsertSchema(experiments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeatureSchema = createInsertSchema(features).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPipelineSchema = createInsertSchema(pipelines).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPipelineStepSchema = createInsertSchema(pipelineSteps).omit({ id: true });
export const insertLabelingTaskSchema = createInsertSchema(labelingTasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLabelSchema = createInsertSchema(labels).omit({ id: true, createdAt: true });
export const insertPredictionSchema = createInsertSchema(predictions).omit({ id: true, createdAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;
export type Feature = typeof features.$inferSelect;
export type InsertFeature = z.infer<typeof insertFeatureSchema>;
export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type PipelineStep = typeof pipelineSteps.$inferSelect;
export type InsertPipelineStep = z.infer<typeof insertPipelineStepSchema>;
export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type LabelingTask = typeof labelingTasks.$inferSelect;
export type InsertLabelingTask = z.infer<typeof insertLabelingTaskSchema>;
export type Label = typeof labels.$inferSelect;
export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type Integration = typeof integrations.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
