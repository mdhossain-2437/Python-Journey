import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "./auth";

interface WSClient {
  ws: WebSocket;
  userId: string;
  subscriptions: Set<string>;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();

  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
    });

    this.wss.on("connection", (ws, request) => {
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(4001, "Authentication required");
        return;
      }

      const user = verifyToken(token);
      if (!user) {
        ws.close(4001, "Invalid token");
        return;
      }

      const clientId = `${user.id}-${Date.now()}`;
      const client: WSClient = {
        ws,
        userId: user.id,
        subscriptions: new Set(),
      };

      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${clientId}`);

      // Send connection acknowledgment
      this.sendToClient(clientId, {
        type: "connected",
        data: { clientId, userId: user.id },
      });

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error("Invalid WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });

    console.log("✅ WebSocket server initialized");
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "subscribe":
        // Subscribe to specific channels (pipelines, experiments, etc.)
        if (message.channel) {
          client.subscriptions.add(message.channel);
          this.sendToClient(clientId, {
            type: "subscribed",
            channel: message.channel,
          });
        }
        break;

      case "unsubscribe":
        if (message.channel) {
          client.subscriptions.delete(message.channel);
          this.sendToClient(clientId, {
            type: "unsubscribed",
            channel: message.channel,
          });
        }
        break;

      case "ping":
        this.sendToClient(clientId, { type: "pong" });
        break;
    }
  }

  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  // Broadcast to all clients subscribed to a channel
  broadcast(channel: string, data: any) {
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: "broadcast",
          channel,
          data,
          timestamp: new Date().toISOString(),
        }));
      }
    });
  }

  // Send to a specific user (all their connections)
  sendToUser(userId: string, data: any) {
    this.clients.forEach((client, clientId) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: "message",
          data,
          timestamp: new Date().toISOString(),
        }));
      }
    });
  }

  // Broadcast to all connected clients
  broadcastAll(data: any) {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: "broadcast",
          data,
          timestamp: new Date().toISOString(),
        }));
      }
    });
  }

  // Pipeline-specific updates
  notifyPipelineUpdate(pipelineId: string, status: string, step?: any) {
    this.broadcast(`pipeline:${pipelineId}`, {
      type: "pipeline_update",
      pipelineId,
      status,
      step,
    });

    // Also broadcast to general pipeline channel
    this.broadcast("pipelines", {
      type: "pipeline_status_change",
      pipelineId,
      status,
    });
  }

  // Experiment updates
  notifyExperimentUpdate(experimentId: string, data: any) {
    this.broadcast(`experiment:${experimentId}`, {
      type: "experiment_update",
      experimentId,
      ...data,
    });

    this.broadcast("experiments", {
      type: "experiment_status_change",
      experimentId,
      status: data.status,
    });
  }

  // Model deployment notifications
  notifyModelDeployment(modelId: string, stage: string) {
    this.broadcastAll({
      type: "model_deployed",
      modelId,
      stage,
    });
  }

  // Alert notifications
  notifyAlert(userId: string, alert: any) {
    this.sendToUser(userId, {
      type: "new_alert",
      alert,
    });
  }

  // Get connection stats
  getStats() {
    return {
      totalConnections: this.clients.size,
      users: new Set(Array.from(this.clients.values()).map(c => c.userId)).size,
    };
  }
}

export const wsService = new WebSocketService();

