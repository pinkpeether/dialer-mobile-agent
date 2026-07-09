import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '@/config';
import { useAuthStore } from '@/store/auth.store';
import { SOCKET_EVENTS, type SocketEventName } from '@/constants/socketEvents';

let socketInstance: Socket | null = null;

export function useSocket() {
  const token = useAuthStore((s) => s.token);
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;
    if (!socketInstance) {
      socketInstance = io(APP_CONFIG.WS_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });
    }
    ref.current = socketInstance;
    return () => { /* keep singleton */ };
  }, [token]);

  const emit = useCallback((ev: SocketEventName | string, data?: unknown) => {
    socketInstance?.emit(ev, data);
  }, []);

  const on = useCallback(
    (ev: SocketEventName | string, handler: (...a: unknown[]) => void) => {
      socketInstance?.on(ev, handler);
      return () => socketInstance?.off(ev, handler);
    },
    [],
  );

  const updateStatus = useCallback((status: string) => {
    socketInstance?.emit(SOCKET_EVENTS.AGENT_STATUS, status);
  }, []);

  return { socket: ref.current, emit, on, updateStatus, isConnected: !!socketInstance?.connected };
}

export function disconnectSocket() {
  socketInstance?.disconnect();
  socketInstance = null;
}
