import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { query } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import * as notificationService from "../services/notification.service";
import logger from "../utils/logger";

export async function triggerSOS(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { rideId, location } = req.body;

    if (!location?.lat || !location?.lng) {
      throw new AppError("Location (lat, lng) is required", 400);
    }

    // Get user details
    const userResult = await query<{ id: string; name: string; email: string; phone: string }>(
      "SELECT id, name, email, phone FROM users WHERE clerk_id = $1",
      [userId]
    );
    if (!userResult.rows.length) throw new AppError("User not found", 404);
    const user = userResult.rows[0];

    // Get emergency contacts
    const contactsResult = await query<{ name: string; phone: string }>(
      "SELECT name, phone FROM emergency_contacts WHERE user_id = $1",
      [user.id]
    );

    // Log SOS alert to DB
    await query(
      `INSERT INTO sos_alerts(user_id, ride_id, lat, lng) VALUES($1, $2, $3, $4)`,
      [user.id, rideId ?? null, location.lat, location.lng]
    );

    // Notify emergency contacts
    const contacts = contactsResult.rows;
    if (contacts.length) {
      await notificationService.sendSOSNotification(user, contacts, location, rideId);
    }

    logger.warn(`🚨 SOS triggered by user ${userId} at [${location.lat}, ${location.lng}]`);

    res.json({
      success: true,
      message: "SOS alert triggered. Emergency contacts have been notified.",
      data: { contactsNotified: contacts.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSOSHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query(
      `SELECT sa.* FROM sos_alerts sa JOIN users u ON u.id = sa.user_id
       WHERE u.clerk_id = $1 ORDER BY sa.created_at DESC LIMIT 10`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}
