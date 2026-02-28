import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { query } from "../config/database";
import { AppError } from "../middleware/error.middleware";

export async function getNearbyDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) throw new AppError("lat and lng are required", 400);

    // Uses PostGIS point-in-circle query
    const result = await query(
      `SELECT d.id, u.name, u.profile_picture, d.rating, d.vehicle_type, d.current_lat, d.current_lng,
              (6371 * acos(cos(radians($1)) * cos(radians(d.current_lat)) *
               cos(radians(d.current_lng) - radians($2)) +
               sin(radians($1)) * sin(radians(d.current_lat)))) AS distance_km
       FROM drivers d JOIN users u ON u.id = d.user_id
       WHERE d.status = 'online'
       HAVING distance_km < $3
       ORDER BY distance_km
       LIMIT 10`,
      [lat, lng, radius]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { status } = req.body; // 'online' | 'offline' | 'busy'
    if (!["online", "offline", "busy"].includes(status)) {
      throw new AppError("Invalid status value", 400);
    }
    await query(
      `UPDATE drivers SET status = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [status, userId]
    );
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    next(err);
  }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { lat, lng } = req.body;
    if (!lat || !lng) throw new AppError("lat and lng are required", 400);

    await query(
      `UPDATE drivers SET current_lat = $1, current_lng = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [lat, lng, userId]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// admin helper: set a driver's location by driver id (NOT user_id)
export async function setDriverLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;             // driver id
    const { lat, lng } = req.body;
    if (!lat || !lng) throw new AppError("lat and lng are required", 400);

    // ensure driver exists
    const exist = await query("SELECT id FROM drivers WHERE id = $1", [id]);
    if (!exist.rows.length) throw new AppError("Driver not found", 404);

    await query(
      `UPDATE drivers SET current_lat = $1, current_lng = $2, updated_at = NOW() WHERE id = $3`,
      [lat, lng, id]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getEarnings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const period = req.query.period ?? "week";

    const intervalMap: Record<string, string> = {
      week: "7 days", month: "30 days", year: "365 days",
    };
    const interval = intervalMap[period as string] ?? "7 days";

    const result = await query(
      `SELECT
         COALESCE(SUM(p.driver_amount), 0)         AS total_earnings,
         COUNT(r.id)                                AS total_rides,
         COALESCE(AVG(r.final_fare), 0)             AS avg_fare
       FROM rides r
       JOIN payments p ON p.ride_id = r.id
       JOIN drivers d ON d.id = r.driver_id
       JOIN users u ON u.id = d.user_id
       WHERE d.user_id = $1
         AND r.completed_at >= NOW() - INTERVAL '${interval}'
         AND r.status = 'completed'`,
      [userId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function getDriverProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT d.*, u.first_name, u.last_name, u.profile_picture, u.rating
       FROM drivers d JOIN users u ON u.id = d.user_id WHERE d.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) throw new AppError("Driver not found", 404);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

// Return all registered drivers along with their current locations
export async function getRegisteredDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT d.id, u.first_name || ' ' || u.last_name AS name,
              u.email, d.current_lat, d.current_lng, d.status
       FROM drivers d
       JOIN users u ON u.id = d.user_id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { make, model, year, color, licensePlate, type } = req.body;

    await query(
      `INSERT INTO vehicles(driver_id, make, model, year, color, license_plate, type)
       VALUES((SELECT id FROM drivers WHERE user_id = $1), $2, $3, $4, $5, $6, $7)
       ON CONFLICT (driver_id) DO UPDATE SET
         make = EXCLUDED.make, model = EXCLUDED.model, year = EXCLUDED.year,
         color = EXCLUDED.color, license_plate = EXCLUDED.license_plate, type = EXCLUDED.type`,
      [userId, make, model, year, color, licensePlate, type]
    );
    res.json({ success: true, message: "Vehicle updated" });
  } catch (err) {
    next(err);
  }
}

export async function submitDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { documentType, documentUrl } = req.body;

    await query(
      `INSERT INTO driver_documents(driver_id, document_type, document_url)
       VALUES((SELECT id FROM drivers WHERE user_id = $1), $2, $3)
       ON CONFLICT (driver_id, document_type) DO UPDATE SET document_url = EXCLUDED.document_url, verified = false`,
      [userId, documentType, documentUrl]
    );
    res.status(201).json({ success: true, message: "Document submitted for review" });
  } catch (err) {
    next(err);
  }
}
