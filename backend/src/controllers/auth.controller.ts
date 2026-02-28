import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/database";
import logger from "../utils/logger";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.JWT_SECRET!;
const SALT_ROUNDS = 12;

function makeToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  const { firstName, lastName, email, password, role = "rider", lat, lng } = req.body;
  // generate a unique clerk identifier (was required by schema)
  const clerkId = uuidv4();
  if (!firstName || !email || !password) {
    res.status(400).json({ error: "firstName, email, and password are required." });
    return;
  }

  // For drivers, location is required
  if (role === "driver" && (!lat || !lng)) {
    res.status(400).json({ error: "Location (lat, lng) is required for driver registration" });
    return;
  }

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if ((existing.rows as unknown[]).length > 0) {
      res.status(409).json({ error: "Email already in use." });
      return;
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const safeRole = role === "driver" ? "driver" : "rider";

    const result = await query(
      `INSERT INTO users(clerk_id, email, first_name, last_name, password_hash, role)
       VALUES($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role`,
      [clerkId, email, firstName, lastName ?? "", hash, safeRole]
    );
    const user = (result.rows as { id: string; email: string; first_name: string; last_name: string; role: string }[])[0];
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");

    // Auto-create drivers record for driver accounts with location
    if (safeRole === "driver") {
      await query(
        `INSERT INTO drivers(user_id, status, current_lat, current_lng) 
         VALUES($1, 'offline', $2, $3) 
         ON CONFLICT (user_id) DO UPDATE 
         SET current_lat = $2, current_lng = $3`,
        [user.id, lat, lng]
      );
    }

    const token = makeToken({
      userId: user.id, email: user.email, role: user.role,
      firstName: user.first_name, lastName: user.last_name,
    });

    logger.info(`Registered: ${email} (${safeRole})`);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name, role: user.role } });
  } catch (err) {
    logger.error("register error:", err);
    // include message for debugging (remove in prod)
    res.status(500).json({ error: "Registration failed.", details: (err as Error).message });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required." });
    return;
  }

  try {
    const result = await query(
      "SELECT id, email, first_name, last_name, password_hash, role FROM users WHERE email = $1",
      [email]
    );
    const rows = result.rows as { id: string; email: string; first_name: string; last_name: string; password_hash: string; role: string }[];
    if (rows.length === 0) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    const token = makeToken({ userId: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name });

    logger.info(`Login: ${email}`);
    res.json({ token, user: { id: user.id, email: user.email, name, role: user.role } });
  } catch (err) {
    logger.error("login error:", err);
    res.status(500).json({ error: "Login failed.", details: (err as Error).message });
  }
}

// GET /api/auth/me  (requires authenticate middleware)
export async function me(req: Request, res: Response) {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await query(
      "SELECT id, email, first_name, last_name, role, profile_picture, created_at FROM users WHERE id = $1",
      [authReq.userId]
    );
    const rows = result.rows as { id: string; email: string; first_name: string; last_name: string; role: string; profile_picture: string; created_at: string }[];
    if (rows.length === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const u = rows[0];
    res.json({ ...u, name: [u.first_name, u.last_name].filter(Boolean).join(" ") });
  } catch (err) {
    logger.error("me error:", err);
    res.status(500).json({ error: "Failed to fetch user." });
  }
}
