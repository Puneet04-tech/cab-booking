import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";

export interface AuthenticatedRequest extends Request {
  userId: string;
  userRole: string;
}

/**
 * Verifies the JWT from the Authorization header.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "No bearer token provided" });
      return;
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };

    (req as AuthenticatedRequest).userId = payload.userId;
    (req as AuthenticatedRequest).userRole = payload.role ?? "rider";

    next();
  } catch (err) {
    logger.warn("Auth failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Role-based guard. Use after `authenticate`.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as AuthenticatedRequest).userRole;
    if (!roles.includes(userRole)) {
      res.status(403).json({ error: `Access denied. Required role(s): ${roles.join(", ")}` });
      return;
    }
    next();
  };
}
