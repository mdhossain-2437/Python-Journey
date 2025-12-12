import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./use-auth";

type MessageHandler = (data: any) => void;

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
}

interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
  timestamp?: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 3,
    enabled = true,
  } = options;

  const { token, isAuthenticated } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const messageHandlers = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      if (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING) {
        ws.current.close();
      }
      ws.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Don't connect if disabled or no token
    if (!enabled || !token) {
      return;
    }

    // Don't connect if already connected or connecting
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    // Clean up any existing connection
    cleanup();

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      ws.current.onclose = (event) => {
        console.log("[WebSocket] Disconnected", event.code, event.reason);
        setIsConnected(false);
        onDisconnect?.();

        // Attempt reconnection if enabled and within limits
        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts && enabled) {
          reconnectAttempts.current++;
          console.log(`[WebSocket] Reconnecting (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError("Max reconnection attempts reached");
          console.log("[WebSocket] Max reconnection attempts reached, giving up");
        }
      };

      ws.current.onerror = (error) => {
        // Don't log error details as they're often empty for WebSocket errors
        console.log("[WebSocket] Connection error occurred");
        setConnectionError("Connection failed");
        onError?.(error);
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);

          // Dispatch to channel handlers
          if (message.channel) {
            const handlers = messageHandlers.current.get(message.channel);
            if (handlers) {
              handlers.forEach((handler) => {
                try {
                  handler(message.data);
                } catch (e) {
                  console.error("[WebSocket] Handler error:", e);
                }
              });
            }
          }

          // Dispatch to type handlers
          if (message.type) {
            const typeHandlers = messageHandlers.current.get(`type:${message.type}`);
            if (typeHandlers) {
              typeHandlers.forEach((handler) => {
                try {
                  handler(message);
                } catch (e) {
                  console.error("[WebSocket] Handler error:", e);
                }
              });
            }
          }
        } catch (e) {
          console.error("[WebSocket] Failed to parse message:", e);
        }
      };
    } catch (error) {
      console.error("[WebSocket] Failed to create connection:", error);
      setConnectionError("Failed to create connection");
    }
  }, [token, enabled, autoReconnect, maxReconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
    setIsConnected(false);
    reconnectAttempts.current = maxReconnectAttempts; // Prevent auto-reconnect
  }, [cleanup, maxReconnectAttempts]);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((channel: string, handler: MessageHandler) => {
    if (!messageHandlers.current.has(channel)) {
      messageHandlers.current.set(channel, new Set());
    }
    messageHandlers.current.get(channel)!.add(handler);

    // Send subscription request to server
    send({ type: "subscribe", channel });

    // Return unsubscribe function
    return () => {
      messageHandlers.current.get(channel)?.delete(handler);
      send({ type: "unsubscribe", channel });
    };
  }, [send]);

  const subscribeToType = useCallback((type: string, handler: MessageHandler) => {
    const key = `type:${type}`;
    if (!messageHandlers.current.has(key)) {
      messageHandlers.current.set(key, new Set());
    }
    messageHandlers.current.get(key)!.add(handler);

    return () => {
      messageHandlers.current.get(key)?.delete(handler);
    };
  }, []);

  // Connect when authenticated and enabled
  useEffect(() => {
    if (isAuthenticated && enabled) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [isAuthenticated, enabled, connect, cleanup]);

  return {
    isConnected,
    lastMessage,
    connectionError,
    send,
    subscribe,
    subscribeToType,
    connect,
    disconnect,
  };
}

// Hook for subscribing to pipeline updates
export function usePipelineUpdates(pipelineId?: string) {
  const { subscribe, isConnected } = useWebSocket({ enabled: !!pipelineId });
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (!pipelineId || !isConnected) return;

    const unsubscribe = subscribe(`pipeline:${pipelineId}`, (data) => {
      setUpdates((prev) => [...prev, data]);
    });

    return unsubscribe;
  }, [pipelineId, isConnected, subscribe]);

  return { updates, isConnected };
}

// Hook for subscribing to alert notifications
export function useAlertNotifications() {
  const { subscribe, isConnected } = useWebSocket();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe("alerts", (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  return { alerts, isConnected };
}

export default useWebSocket;

