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
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const { token, isAuthenticated } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const messageHandlers = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback(() => {
    if (!token || ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Dispatch to handlers
          const handlers = messageHandlers.current.get(message.type);
          if (handlers) {
            handlers.forEach((handler) => handler(message.data || message));
          }

          // Also dispatch channel-specific messages
          if (message.channel) {
            const channelHandlers = messageHandlers.current.get(`channel:${message.channel}`);
            if (channelHandlers) {
              channelHandlers.forEach((handler) => handler(message.data || message));
            }
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        onDisconnect?.();

        // Auto-reconnect
        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`Reconnecting (attempt ${reconnectAttempts.current})...`);
          setTimeout(connect, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [token, onConnect, onDisconnect, onError, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const send = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    send({ type: "subscribe", channel });
  }, [send]);

  const unsubscribe = useCallback((channel: string) => {
    send({ type: "unsubscribe", channel });
  }, [send]);

  const on = useCallback((event: string, handler: MessageHandler) => {
    if (!messageHandlers.current.has(event)) {
      messageHandlers.current.set(event, new Set());
    }
    messageHandlers.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      messageHandlers.current.get(event)?.delete(handler);
    };
  }, []);

  const onChannel = useCallback((channel: string, handler: MessageHandler) => {
    return on(`channel:${channel}`, handler);
  }, [on]);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
    unsubscribe,
    on,
    onChannel,
    connect,
    disconnect,
  };
}

// Specialized hooks for specific use cases
export function usePipelineUpdates(pipelineId: string, onUpdate: (data: any) => void) {
  const { subscribe, unsubscribe, onChannel } = useWebSocket();

  useEffect(() => {
    subscribe(`pipeline:${pipelineId}`);
    const unsubscribeHandler = onChannel(`pipeline:${pipelineId}`, onUpdate);

    return () => {
      unsubscribe(`pipeline:${pipelineId}`);
      unsubscribeHandler();
    };
  }, [pipelineId, subscribe, unsubscribe, onChannel, onUpdate]);
}

export function useExperimentUpdates(experimentId: string, onUpdate: (data: any) => void) {
  const { subscribe, unsubscribe, onChannel } = useWebSocket();

  useEffect(() => {
    subscribe(`experiment:${experimentId}`);
    const unsubscribeHandler = onChannel(`experiment:${experimentId}`, onUpdate);

    return () => {
      unsubscribe(`experiment:${experimentId}`);
      unsubscribeHandler();
    };
  }, [experimentId, subscribe, unsubscribe, onChannel, onUpdate]);
}

export function useAlertNotifications(onAlert: (alert: any) => void) {
  const { on } = useWebSocket();

  useEffect(() => {
    const unsubscribe = on("new_alert", onAlert);
    return unsubscribe;
  }, [on, onAlert]);
}

