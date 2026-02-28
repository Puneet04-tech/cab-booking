import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { query } from "../config/database";
import { AppError } from "../middleware/error.middleware";

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query<{
      id: string; clerk_id: string; name: string; email: string; phone: string;
      role: string; profile_picture: string; rating: number; created_at: string;
    }>(
      "SELECT id, clerk_id, name, email, phone, role, profile_picture, rating, created_at FROM users WHERE clerk_id = $1",
      [userId]
    );
    if (!result.rows.length) throw new AppError("User not found", 404);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { firstName, lastName, phone, bio } = req.body;
    const name = [firstName, lastName].filter(Boolean).join(" ");

    const result = await query<{ id: string; name: string; phone: string }>(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       bio = COALESCE($3, bio), updated_at = NOW()
       WHERE clerk_id = $4 RETURNING id, name, phone`,
      [name || null, phone, bio, userId]
    );
    if (!result.rows.length) throw new AppError("User not found", 404);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function addEmergencyContact(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { name, phone } = req.body;
    if (!name || !phone) throw new AppError("Name and phone are required", 400);

    const userResult = await query<{ id: string }>("SELECT id FROM users WHERE clerk_id = $1", [userId]);
    if (!userResult.rows.length) throw new AppError("User not found", 404);

    const result = await query<{ id: string; name: string; phone: string }>(
      "INSERT INTO emergency_contacts(user_id, name, phone) VALUES($1, $2, $3) RETURNING id, name, phone",
      [userResult.rows[0].id, name, phone]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getEmergencyContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query<{ id: string; name: string; phone: string }>(
      `SELECT ec.id, ec.name, ec.phone FROM emergency_contacts ec
       JOIN users u ON u.id = ec.user_id WHERE u.clerk_id = $1`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function removeEmergencyContact(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    await query(
      `DELETE FROM emergency_contacts WHERE id = $1
       AND user_id = (SELECT id FROM users WHERE clerk_id = $2)`,
      [req.params.id, userId]
    );
    res.json({ success: true, message: "Emergency contact removed" });
  } catch (err) {
    next(err);
  }
}

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query(
      `SELECT n.* FROM notifications n
       JOIN users u ON u.id = n.user_id WHERE u.clerk_id = $1
       ORDER BY n.created_at DESC LIMIT 20`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    await query("UPDATE notifications SET read = true WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
}
