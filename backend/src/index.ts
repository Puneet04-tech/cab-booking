import "dotenv/config";
import http from "http";
import app from "./app";
import { initSocket } from "./socket";
import { testConnection } from "./config/database";
import logger from "./utils/logger";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

async function bootstrap() {
  // Test DB connection
  await testConnection();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`🚀 RideSwift backend running on port ${PORT}`);
    logger.info(`   Environment : ${process.env.NODE_ENV}`);
    logger.info(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully…`);
    server.close(() => {
      logger.info("Server closed.");
      process.exit(0);
    });
    setTimeout(() => {
      logger.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
 