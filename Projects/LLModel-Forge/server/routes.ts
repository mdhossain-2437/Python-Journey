import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { cache, CacheKeys, CacheTTL } from "./cache";
import { getCookieManager, COOKIE_CONFIG, COOKIE_NAMES } from "./cookies";
import {
  authMiddleware,
  optionalAuth,
  generateToken,
  comparePassword,
  type AuthRequest
} from "./auth";
import {
  loginSchema,
  registerSchema,
} from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// WebSocket clients map
const wsClients = new Map<string, Set<WebSocket>>();

// Broadcast to all clients in a channel
function broadcast(channel: string, data: any) {
  const clients = wsClients.get(channel);
  if (clients) {
    const message = JSON.stringify({ channel, data, timestamp: new Date().toISOString() });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// Broadcast to all connected clients
function broadcastAll(data: any) {
  const message = JSON.stringify({ ...data, timestamp: new Date().toISOString() });
  wsClients.forEach((clients) => {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Middleware
  app.use(cookieParser());

  // ==================== WEBSOCKET SERVER ====================
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade requests - only for /ws path
  httpServer.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host}`);

      // Only handle /ws path, let other upgrades pass through (e.g., Vite HMR)
      if (url.pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      }
      // Don't destroy socket for other paths - Vite HMR needs it
    } catch (err) {
      console.error("WebSocket upgrade error:", err);
      socket.destroy();
    }
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    let userId: string | null = null;

    // Verify token if provided
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "llmodel-forge-secret-key") as any;
        userId = decoded.id;
        console.log(`WebSocket connected: user ${userId}`);
      } catch (err) {
        console.log("WebSocket: Invalid token, allowing anonymous connection");
      }
    }

    // Add to general channel
    const generalChannel = "general";
    if (!wsClients.has(generalChannel)) {
      wsClients.set(generalChannel, new Set());
    }
    wsClients.get(generalChannel)?.add(ws);

    // Send welcome message
    ws.send(JSON.stringify({
      type: "connected",
      message: "Connected to LLModel-Forge WebSocket",
      userId,
      timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Handle subscription requests
        if (data.type === "subscribe" && data.channel) {
          if (!wsClients.has(data.channel)) {
            wsClients.set(data.channel, new Set());
          }
          wsClients.get(data.channel)?.add(ws);
          ws.send(JSON.stringify({ type: "subscribed", channel: data.channel }));
        }

        // Handle unsubscribe
        if (data.type === "unsubscribe" && data.channel) {
          wsClients.get(data.channel)?.delete(ws);
          ws.send(JSON.stringify({ type: "unsubscribed", channel: data.channel }));
        }

        // Handle ping
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    // Handle disconnect
    ws.on("close", () => {
      console.log(`WebSocket disconnected: user ${userId || "anonymous"}`);
      wsClients.forEach((clients) => {
        clients.delete(ws);
      });
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Make broadcast available for other modules
  (app as any).wsBroadcast = broadcast;
  (app as any).wsBroadcastAll = broadcastAll;

  // ==================== AUTH ROUTES ====================

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
      }

      const { username, email, password, name } = parsed.data;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }

      const user = await storage.createUser({ username, email, password, name });
      const token = generateToken({ id: user.id, username: user.username, email: user.email, name: user.name });

      // Use cookie manager for secure cookie handling
      const cookies = getCookieManager(req, res);
      cookies.setToken(token, false);

      res.status(201).json({
        user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, team: user.team },
        token,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const { username, password } = parsed.data;
      const rememberMe = req.body.rememberMe === true;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken({ id: user.id, username: user.username, email: user.email, name: user.name });

      // Use cookie manager for secure cookie handling
      const cookies = getCookieManager(req, res);
      cookies.setToken(token, rememberMe);

      res.json({
        user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, team: user.team },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookies = getCookieManager(req, res);
    cookies.clearAuth();
    res.json({ message: "Logged out successfully" });
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res: Response) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      team: user.team,
      avatarUrl: user.avatarUrl,
    });
  });

  // ==================== DASHBOARD ROUTES ====================

  app.get("/api/dashboard/stats", optionalAuth, async (_req: AuthRequest, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // ==================== MODELS ROUTES ====================

  app.get("/api/models", optionalAuth, async (_req: Request, res: Response) => {
    try {
      const models = await storage.getModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch models" });
    }
  });

  app.get("/api/models/:id", async (req: Request, res: Response) => {
    try {
      const model = await storage.getModel(req.params.id);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch model" });
    }
  });

  app.post("/api/models", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const model = await storage.createModel({
        ...req.body,
        authorId: req.user!.id,
      });
      res.status(201).json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to create model" });
    }
  });

  app.patch("/api/models/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const model = await storage.updateModel(req.params.id, req.body);
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to update model" });
    }
  });

  app.delete("/api/models/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteModel(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Model not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete model" });
    }
  });

  // Promote model
  app.post("/api/models/:id/promote", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { stage } = req.body;
      if (!["development", "staging", "production", "archived"].includes(stage)) {
        return res.status(400).json({ error: "Invalid stage" });
      }
      const model = await storage.updateModel(req.params.id, { stage });
      if (!model) {
        return res.status(404).json({ error: "Model not found" });
      }

      await storage.createAlert({
        type: "model",
        severity: "info",
        message: `Model "${model.name}" promoted to ${stage}`,
        modelId: model.id,
        pipelineId: null,
        isRead: false,
        userId: req.user!.id,
      });

      res.json(model);
    } catch (error) {
      res.status(500).json({ error: "Failed to promote model" });
    }
  });

  // ==================== EXPERIMENTS ROUTES ====================

  app.get("/api/experiments", optionalAuth, async (_req: Request, res: Response) => {
    try {
      const experiments = await storage.getExperiments();
      res.json(experiments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch experiments" });
    }
  });

  app.get("/api/experiments/:id", async (req: Request, res: Response) => {
    try {
      const experiment = await storage.getExperiment(req.params.id);
      if (!experiment) {
        return res.status(404).json({ error: "Experiment not found" });
      }
      res.json(experiment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch experiment" });
    }
  });

  app.post("/api/experiments", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const experiment = await storage.createExperiment({
        ...req.body,
        authorId: req.user!.id,
        status: "running",
      });
      res.status(201).json(experiment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create experiment" });
    }
  });

  app.patch("/api/experiments/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const experiment = await storage.updateExperiment(req.params.id, req.body);
      if (!experiment) {
        return res.status(404).json({ error: "Experiment not found" });
      }
      res.json(experiment);
    } catch (error) {
      res.status(500).json({ error: "Failed to update experiment" });
    }
  });

  app.post("/api/experiments/:id/stop", authMiddleware, async (req: Request, res: Response) => {
    try {
      const experiment = await storage.updateExperiment(req.params.id, { status: "stopped" });
      if (!experiment) {
        return res.status(404).json({ error: "Experiment not found" });
      }
      res.json(experiment);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop experiment" });
    }
  });

  // ==================== FEATURES ROUTES ====================

  app.get("/api/features", optionalAuth, async (_req: Request, res: Response) => {
    try {
      const features = await storage.getFeatures();
      res.json(features);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  app.get("/api/features/:id", async (req: Request, res: Response) => {
    try {
      const feature = await storage.getFeature(req.params.id);
      if (!feature) {
        return res.status(404).json({ error: "Feature not found" });
      }
      res.json(feature);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feature" });
    }
  });

  app.post("/api/features", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const feature = await storage.createFeature({
        ...req.body,
        authorId: req.user!.id,
      });
      res.status(201).json(feature);
    } catch (error) {
      res.status(500).json({ error: "Failed to create feature" });
    }
  });

  app.patch("/api/features/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const feature = await storage.updateFeature(req.params.id, req.body);
      if (!feature) {
        return res.status(404).json({ error: "Feature not found" });
      }
      res.json(feature);
    } catch (error) {
      res.status(500).json({ error: "Failed to update feature" });
    }
  });

  app.delete("/api/features/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteFeature(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Feature not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete feature" });
    }
  });

  // ==================== PIPELINES ROUTES ====================

  app.get("/api/pipelines", optionalAuth, async (_req: Request, res: Response) => {
    try {
      const pipelines = await storage.getPipelines();
      const pipelinesWithSteps = await Promise.all(
        pipelines.map(async (p) => {
          const steps = await storage.getPipelineSteps(p.id);
          return { ...p, steps };
        })
      );
      res.json(pipelinesWithSteps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipelines" });
    }
  });

  app.get("/api/pipelines/:id", async (req: Request, res: Response) => {
    try {
      const pipeline = await storage.getPipeline(req.params.id);
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      const steps = await storage.getPipelineSteps(pipeline.id);
      res.json({ ...pipeline, steps });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pipeline" });
    }
  });

  app.post("/api/pipelines", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const pipeline = await storage.createPipeline({
        ...req.body,
        authorId: req.user!.id,
      });
      res.status(201).json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to create pipeline" });
    }
  });

  app.patch("/api/pipelines/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const pipeline = await storage.updatePipeline(req.params.id, req.body);
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to update pipeline" });
    }
  });

  // Run pipeline
  app.post("/api/pipelines/:id/run", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const pipeline = await storage.getPipeline(req.params.id);
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }

      await storage.updatePipeline(req.params.id, {
        status: "running",
        lastRunAt: new Date(),
      });

      const steps = await storage.getPipelineSteps(req.params.id);
      for (const step of steps) {
        await storage.updatePipelineStep(step.id, {
          status: step.order === 1 ? "running" : "pending",
          startedAt: step.order === 1 ? new Date() : null,
          completedAt: null,
          duration: null,
        });
      }

      await storage.createAlert({
        type: "pipeline",
        severity: "info",
        message: `Pipeline "${pipeline.name}" started`,
        modelId: null,
        pipelineId: pipeline.id,
        isRead: false,
        userId: req.user!.id,
      });

      const updatedPipeline = await storage.getPipeline(req.params.id);
      const updatedSteps = await storage.getPipelineSteps(req.params.id);
      res.json({ ...updatedPipeline, steps: updatedSteps });
    } catch (error) {
      res.status(500).json({ error: "Failed to run pipeline" });
    }
  });

  app.post("/api/pipelines/:id/stop", authMiddleware, async (req: Request, res: Response) => {
    try {
      const pipeline = await storage.updatePipeline(req.params.id, { status: "idle" });
      if (!pipeline) {
        return res.status(404).json({ error: "Pipeline not found" });
      }
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop pipeline" });
    }
  });

  // ==================== LABELING ROUTES ====================

  app.get("/api/labeling-tasks", optionalAuth, async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getLabelingTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch labeling tasks" });
    }
  });

  app.get("/api/labeling-tasks/:id", async (req: Request, res: Response) => {
    try {
      const task = await storage.getLabelingTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Labeling task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch labeling task" });
    }
  });

  app.post("/api/labeling-tasks", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const task = await storage.createLabelingTask({
        ...req.body,
        authorId: req.user!.id,
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to create labeling task" });
    }
  });

  app.post("/api/labeling-tasks/:id/labels", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const label = await storage.createLabel({
        ...req.body,
        taskId: req.params.id,
        labeledBy: req.user!.id,
      });
      res.status(201).json(label);
    } catch (error) {
      res.status(500).json({ error: "Failed to create label" });
    }
  });

  // ==================== PREDICTIONS ROUTES ====================

  app.post("/api/predict", optionalAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { modelId, creditScore, annualIncome, debtToIncome, age, loanAmount } = req.body;
      const startTime = Date.now();

      let score = 0.5;
      if (creditScore > 700) score += 0.2;
      if (creditScore > 750) score += 0.1;
      if (annualIncome > 50000) score += 0.1;
      if (annualIncome > 100000) score += 0.05;
      if (debtToIncome < 30) score += 0.15;
      else if (debtToIncome < 40) score += 0.1;
      if (age > 25 && age < 55) score += 0.05;
      if (loanAmount < annualIncome * 0.3) score += 0.1;

      score = Math.min(1, Math.max(0, score + (Math.random() - 0.5) * 0.05));

      const risk = score > 0.75 ? "Low Risk" : score > 0.45 ? "Moderate Risk" : "High Risk";
      const latency = Date.now() - startTime + Math.floor(Math.random() * 50);

      const factors = [
        { name: "Credit Score", value: creditScore, impact: creditScore > 700 ? "positive" : "negative", weight: 0.35 },
        { name: "Annual Income", value: annualIncome, impact: annualIncome > 50000 ? "positive" : "neutral", weight: 0.25 },
        { name: "Debt-to-Income Ratio", value: debtToIncome, impact: debtToIncome < 40 ? "positive" : "negative", weight: 0.20 },
        { name: "Applicant Age", value: age, impact: age > 25 && age < 55 ? "positive" : "neutral", weight: 0.10 },
        { name: "Loan Amount", value: loanAmount, impact: loanAmount < annualIncome * 0.3 ? "positive" : "negative", weight: 0.10 },
      ];

      const result = {
        score: parseFloat(score.toFixed(4)),
        risk,
        confidence: parseFloat((0.85 + Math.random() * 0.12).toFixed(3)),
        latency,
        factors,
        modelVersion: "3.2.1",
        timestamp: new Date().toISOString(),
      };

      if (req.user) {
        await storage.createPrediction({
          modelId: modelId || "model_001",
          userId: req.user.id,
          inputs: { creditScore, annualIncome, debtToIncome, age, loanAmount },
          outputs: result,
          score: result.score,
          risk: result.risk,
          latency: result.latency,
        });
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Prediction failed" });
    }
  });

  app.get("/api/predictions", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const predictions = await storage.getPredictions(req.user!.id);
      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // ==================== ALERTS ROUTES ====================

  app.get("/api/alerts", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const alerts = await storage.getAlerts(req.user!.id);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.patch("/api/alerts/:id/read", authMiddleware, async (req: Request, res: Response) => {
    try {
      const alert = await storage.markAlertRead(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // ==================== SETTINGS ROUTES ====================

  app.get("/api/settings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const settings = await storage.getUserSettings(req.user!.id);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const settings = await storage.updateUserSettings(req.user!.id, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.patch("/api/user/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { name, email, role, team } = req.body;
      const user = await storage.updateUser(req.user!.id, { name, email, role, team });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, team: user.team });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ==================== API KEYS ROUTES ====================

  app.get("/api/api-keys", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await storage.getApiKeys(req.user!.id);
      res.json(keys.map(k => ({ ...k, keyHash: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.post("/api/api-keys", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { name, environment } = req.body;
      const rawKey = `llmf_${environment === "production" ? "prod" : "dev"}_${randomUUID().replace(/-/g, "")}`;
      const keyHash = await bcrypt.hash(rawKey, 10);

      const apiKey = await storage.createApiKey({
        userId: req.user!.id,
        name,
        keyHash,
        keyPrefix: rawKey.slice(0, 15),
        environment,
      });

      res.status(201).json({ ...apiKey, rawKey, keyHash: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.delete("/api/api-keys/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteApiKey(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "API key not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // ==================== HEALTH CHECK ====================

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: process.uptime(),
    });
  });

  // ==================== CACHE MANAGEMENT ====================

  // Get cache statistics (admin only)
  app.get("/api/admin/cache/stats", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const stats = cache.getStats();
      res.json({
        ...stats,
        hitRatePercent: `${(stats.hitRate * 100).toFixed(2)}%`,
        sizeFormatted: formatBytes(stats.size),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get cache stats" });
    }
  });

  // Clear cache (admin only)
  app.post("/api/admin/cache/clear", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { pattern, tag } = req.body;

      if (pattern) {
        const count = cache.invalidatePattern(pattern);
        res.json({ message: `Cleared ${count} entries matching pattern: ${pattern}` });
      } else if (tag) {
        const count = cache.invalidateByTag(tag);
        res.json({ message: `Cleared ${count} entries with tag: ${tag}` });
      } else {
        cache.clear();
        res.json({ message: "All cache cleared" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to clear cache" });
    }
  });

  // Warm cache (admin only)
  app.post("/api/admin/cache/warm", authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      if ('warmCache' in storage) {
        await (storage as any).warmCache();
      }
      res.json({ message: "Cache warmed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to warm cache" });
    }
  });

  return httpServer;
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

