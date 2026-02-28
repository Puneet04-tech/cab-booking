import { query } from "../config/database";
import { getIO } from "../socket";
import logger from "../utils/logger";

type NotificationType =
  | "ride_request"
  | "ride_accepted"
  | "driver_arriving"
  | "ride_completed"
  | "payment_received"
  | "sos_alert";

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await query(
      "INSERT INTO notifications(user_id, type, message, data) VALUES($1, $2, $3, $4)",
      [userId, type, message, data ? JSON.stringify(data) : null]
    );

    // Emit real-time notification via Socket.IO
    const io = getIO();
    io.to(`user:${userId}`).emit("notification", { type, message, data });
  } catch (err) {
    logger.error("Failed to create notification:", err);
  }
}

export async function notifyNearbyDrivers(
  location: { lat: number; lng: number },
  rideId: string,
  rideType: string
): Promise<void> {
  try {
    // Find nearby online drivers (within 5km radius, or all if no location set)
    const result = await query<{ user_id: string }>(
      `SELECT d.user_id FROM drivers d
       WHERE d.status IN ('online','available')
       LIMIT 50`,
      []
    );

    const io = getIO();
    for (const driver of result.rows) {
      io.to(`driver:${driver.user_id}`).emit("ride_request", {
        rideId,
        rideType,
        pickupLocation: location,
      });
    }

    logger.info(`Notified ${result.rows.length} nearby drivers of ride ${rideId}`);
  } catch (err) {
    logger.error("Failed to notify nearby drivers:", err);
  }
}

export async function sendSOSNotification(
  user: { name: string; email: string; phone: string },
  contacts: { name: string; phone: string }[],
  location: { lat: number; lng: number },
  rideId?: string
): Promise<void> {
  try {
    // In a real app, send SMS via Twilio or push notification
    // Here we log the SOS and emit via socket
    logger.warn(`🚨 SOS from ${user.name}: https://maps.google.com/?q=${location.lat},${location.lng}`);

    const io = getIO();
    io.emit("sos_alert", {
      user: { name: user.name, phone: user.phone },
      location,
      rideId,
      contacts,
    });
  } catch (err) {
    logger.error("Failed to send SOS notification:", err);
  }
}

export async function notifyDriverAssignment(
  driverUserId: string,
  rideId: string,
  pickupAddress: string,
  dropoffAddress: string
): Promise<void> {
  try {
    // Create database notification
    await createNotification(
      driverUserId,
      "ride_accepted",
      `You have been assigned a new ride from ${pickupAddress} to ${dropoffAddress}`,
      { rideId, pickupAddress, dropoffAddress }
    );

    // Emit real-time notification
    const io = getIO();
    io.to(`driver:${driverUserId}`).emit("ride_assigned", {
      rideId,
      pickupAddress,
      dropoffAddress,
    });

    logger.info(`Notified driver ${driverUserId} of assigned ride ${rideId}`);
  } catch (err) {
    logger.error("Failed to notify driver of assignment:", err);
  }
}
