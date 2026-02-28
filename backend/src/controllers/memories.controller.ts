import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// Get ride memories
export async function getRideMemories(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { onlyFavorites } = req.query;
    
    let queryText = `
      SELECT rm.*, 
             r.pickup_address, r.dropoff_address, r.completed_at, r.ride_type
      FROM ride_memories rm
      JOIN rides r ON rm.ride_id = r.id
      WHERE rm.user_id = $1
    `;
    
    if (onlyFavorites === 'true') {
      queryText += ' AND rm.is_favorite = true';
    }
    
    queryText += ' ORDER BY r.completed_at DESC';
    
    const result = await query<{
      id: string;
      ride_id: string;
      title: string;
      notes: string;
      photos: string[];
      is_favorite: boolean;
      pickup_address: string;
      dropoff_address: string;
      completed_at: string;
      ride_type: string;
    }>(queryText, [userId]);
    
    const memories = result.rows.map(m => ({
      id: m.id,
      rideId: m.ride_id,
      title: m.title,
      notes: m.notes,
      photos: m.photos || [],
      isFavorite: m.is_favorite,
      pickupAddress: m.pickup_address,
      dropoffAddress: m.dropoff_address,
      completedAt: m.completed_at,
      rideType: m.ride_type
    }));
    
    res.json({ memories });
  } catch (err) {
    next(err);
  }
}

// Add or update ride memory
export async function saveRideMemory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { rideId, title, notes, photos, isFavorite } = req.body;
    
    if (!rideId) {
      return next(new AppError("Ride ID is required", 400));
    }
    
    // Verify ride belongs to user
    const rideCheck = await query<{ rider_id: string; status: string }>(
      `SELECT rider_id, status FROM rides WHERE id = $1`,
      [rideId]
    );
    
    if (rideCheck.rows.length === 0) {
      return next(new AppError("Ride not found", 404));
    }
    
    if (rideCheck.rows[0].rider_id !== userId) {
      return next(new AppError("Unauthorized", 403));
    }
    
    if (rideCheck.rows[0].status !== 'completed') {
      return next(new AppError("Can only add memories to completed rides", 400));
    }
    
    await query(
      `INSERT INTO ride_memories 
       (ride_id, user_id, title, notes, photos, is_favorite)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (ride_id)
       DO UPDATE SET
         title = EXCLUDED.title,
         notes = EXCLUDED.notes,
         photos = EXCLUDED.photos,
         is_favorite = EXCLUDED.is_favorite,
         updated_at = NOW()`,
      [rideId, userId, title, notes, photos || [], isFavorite || false]
    );
    
    res.json({ message: "Ride memory saved" });
  } catch (err) {
    next(err);
  }
}

// Delete ride memory
export async function deleteRideMemory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { rideId } = req.params;
    
    const result = await query(
      `DELETE FROM ride_memories WHERE ride_id = $1 AND user_id = $2`,
      [rideId, userId]
    );
    
    if (result.rowCount === 0) {
      return next(new AppError("Memory not found", 404));
    }
    
    res.json({ message: "Memory deleted" });
  } catch (err) {
    next(err);
  }
}
