import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./utils/logger";

let io: Server;

export function initSocket(server: HttpServer): void {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ── Auth middleware ────────────────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        role: string;
      };
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role ?? "rider";
      next();
    } catch (err) {
      logger.warn("Socket auth failed", err);
      next(new Error("Unauthorized"));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    const userId: string = (socket as any).userId;
    const userRole: string = (socket as any).userRole;

    logger.info(`Socket connected: ${userId} (${userRole}) [${socket.id}]`);

    // Each user joins their personal room so we can emit targeted events
    socket.join(`user:${userId}`);

    if (userRole === "driver") {
      socket.join(`driver:${userId}`);
      socket.join("drivers"); // broadcast room for nearby-driver queries
    }

    // ── Driver: broadcast live location to rider ─────────────────────────────
    socket.on(
      "driver:location",
      (data: { rideId: string; lat: number; lng: number }) => {
        if (userRole !== "driver") return;
        io.to(`ride:${data.rideId}`).emit("driver:location", {
          driverId: userId,
          lat: data.lat,
          lng: data.lng,
        });
      }
    );

    // ── Join a ride-specific room (both rider & driver do this) ───────────────
    socket.on("join:ride", (rideId: string) => {
      socket.join(`ride:${rideId}`);
      logger.info(`${userId} joined ride room: ride:${rideId}`);
    });

    socket.on("leave:ride", (rideId: string) => {
      socket.leave(`ride:${rideId}`);
    });

    // ── Cleanup ───────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${userId} [${socket.id}]`);
    });
  });

  logger.info("Socket.IO initialised");
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialised. Call initSocket() first.");
  }
  return io;
}
