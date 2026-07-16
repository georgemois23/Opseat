import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "@/features/auth/hooks/useAuth";

type EmitPayload = Record<string, unknown>;

export type CourierAssignment = {
  orderId: string;
  status?: string;
  estimatedDeliveryTime?: string | null;
  etaMinutes?: number;
  courier?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    vehicleType?: string;
  };
};

type SocketEventHandler = (payload: any) => void;

export type SocketContextType = {
  socket: Socket | null;
  connected: boolean;
  pendingOrder: unknown | null;
  clearPendingOrder: () => void;
  courierAssignment: CourierAssignment | null;
  clearCourierAssignment: () => void;
  emitEvent: (event: string, payload?: EmitPayload) => void;
  /** Subscribe to a server socket event. Survives reconnects; returns an unsubscribe fn. */
  subscribe: (event: string, handler: SocketEventHandler) => () => void;
};

export const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<unknown | null>(null);
  const [courierAssignment, setCourierAssignment] = useState<CourierAssignment | null>(null);
  const listenersRef = useRef<Map<string, Set<SocketEventHandler>>>(new Map());

  const subscribe = useCallback((event: string, handler: SocketEventHandler) => {
    let handlers = listenersRef.current.get(event);
    if (!handlers) {
      handlers = new Set();
      listenersRef.current.set(event, handlers);
    }
    handlers.add(handler);
    // Attach to the live socket immediately if one is already connected.
    socketRef.current?.on(event, handler);

    return () => {
      const set = listenersRef.current.get(event);
      set?.delete(handler);
      socketRef.current?.off(event, handler);
    };
  }, []);

  const clearPendingOrder = useCallback(() => {
    setPendingOrder(null);
  }, []);

  const clearCourierAssignment = useCallback(() => {
    setCourierAssignment(null);
  }, []);

  const emitEvent = useCallback((event: string, payload?: EmitPayload) => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    s.emit(event, payload ?? {});
  }, []);

  const resolveSocketUrl = useCallback((): string => {
    const raw = process.env.REACT_APP_API_URL?.trim();
    if (!raw) return window.location.origin;
    // If API base is like http://host:port/api, connect socket at origin.
    return raw.replace(/\/api\/?$/i, "");
  }, []);

  useEffect(() => {
    if (!user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setPendingOrder(null);
      setCourierAssignment(null);
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketUrl = resolveSocketUrl();
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      path: "/socket.io",
      query: {
        userId: user.id,
      },
    });

    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNewOrderAvailable = (order: unknown) => setPendingOrder(order);
    const onCourierAssigned = (payload: CourierAssignment) => setCourierAssignment(payload);
    const onConnectError = (err: Error) => {
      setConnected(false);
      console.error("Socket connect_error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_order_available", onNewOrderAvailable);
    socket.on("courier_assigned", onCourierAssigned);
    socket.on("connect_error", onConnectError);

    // Re-attach any handlers registered via subscribe() to this fresh socket.
    const registered = listenersRef.current;
    registered.forEach((handlers, event) => {
      handlers.forEach((handler) => socket.on(event, handler));
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_order_available", onNewOrderAvailable);
      socket.off("courier_assigned", onCourierAssigned);
      socket.off("connect_error", onConnectError);
      registered.forEach((handlers, event) => {
        handlers.forEach((handler) => socket.off(event, handler));
      });
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
      setConnected(false);
    };
  }, [resolveSocketUrl, user?.id]);

  const value = useMemo<SocketContextType>(
    () => ({
      socket: socketRef.current,
      connected,
      pendingOrder,
      clearPendingOrder,
      courierAssignment,
      clearCourierAssignment,
      emitEvent,
      subscribe,
    }),
    [clearPendingOrder, connected, courierAssignment, clearCourierAssignment, emitEvent, pendingOrder, subscribe]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
