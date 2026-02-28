import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Postgres unique violation
  if ((err as { code?: string }).code === "23505") {
    res.status(409).json({ success: false, error: "Resource already exists" });
    return;
  }

  // Postgres foreign key violation
  if ((err as { code?: string }).code === "23503") {
    res.status(400).json({ success: false, error: "Referenced resource not found" });
    return;
  }

  logger.error("Unhandled error:", { message: err.message, stack: err.stack, path: req.path });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
}
