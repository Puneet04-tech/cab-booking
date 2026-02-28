import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

type EventCallback = (data: unknown) => void;

function getAuthToken(): string {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((r) => r.startsWith("auth_token="))
      ?.split("=")[1] ?? ""
  );
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let socket: Socket;

    const connect = () => {
      const token = getAuthToken();
      socket = io(BACKEND_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        console.log("Socket connected:", socket.id);
      });

      socket.on("disconnect", (reason) => {
        console.warn("Socket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });

      socketRef.current = socket;
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, callback: EventCallback) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback?: EventCallback) => {
    socketRef.current?.off(event, callback);
  }, []);

  return { socket: socketRef.current, emit, on, off };
}
