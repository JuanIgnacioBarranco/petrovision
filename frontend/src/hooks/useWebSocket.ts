// ============================================================
// PetroVision — WebSocket Hook (Real-Time Data)
// ============================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import type { LiveDataMessage } from '@/types';

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;

type WSChannel = 'live-data' | 'alarms' | 'predictions';

interface UseWebSocketOptions {
  channel: WSChannel;
  onMessage?: (data: LiveDataMessage) => void;
  enabled?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket({
  channel,
  onMessage,
  enabled = true,
  reconnectInterval = 3000,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<LiveDataMessage | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/${channel}`);

      ws.onopen = () => {
        console.log(`[WS] Connected to ${channel}`);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as LiveDataMessage;
          setLastMessage(data);
          onMessage?.(data);
        } catch (e) {
          console.warn('[WS] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        console.log(`[WS] Disconnected from ${channel}`);
        setIsConnected(false);
        // Auto-reconnect
        reconnectTimer.current = setTimeout(connect, reconnectInterval);
      };

      ws.onerror = (error) => {
        console.error(`[WS] Error on ${channel}:`, error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('[WS] Connection failed:', e);
      reconnectTimer.current = setTimeout(connect, reconnectInterval);
    }
  }, [channel, enabled, onMessage, reconnectInterval]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}
