import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import logger from "../utils/logger";

// Get all favorite routes for user
export async function getFavoriteRoutes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    const result = await query<{
      id: string;
      route_name: string;
      pickup_address: string;
      pickup_lat: string;
      pickup_lng: string;
      dropoff_address: string;
      dropoff_lat: string;
      dropoff_lng: string;
      preferred_ride_type: string;
      usage_count: number;
      created_at: string;
    }>(
      `SELECT * FROM favorite_routes 
       WHERE user_id = $1 
       ORDER BY usage_count DESC, created_at DESC`,
      [userId]
    );
    
    const routes = result.rows.map(route => ({
      id: route.id,
      routeName: route.route_name,
      pickup: {
        address: route.pickup_address,
        lat: parseFloat(route.pickup_lat),
        lng: parseFloat(route.pickup_lng)
      },
      dropoff: {
        address: route.dropoff_address,
        lat: parseFloat(route.dropoff_lat),
        lng: parseFloat(route.dropoff_lng)
      },
      preferredRideType: route.preferred_ride_type,
      usageCount: route.usage_count,
      createdAt: route.created_at
    }));
    
    res.json({ routes });
  } catch (err) {
    next(err);
  }
}

// Add new favorite route
export async function addFavoriteRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { routeName, pickup, dropoff, preferredRideType } = req.body;
    
    if (!routeName || !pickup || !dropoff) {
      return next(new AppError("Route name, pickup and dropoff are required", 400));
    }
    
    const result = await query<{ id: string }>(
      `INSERT INTO favorite_routes 
       (user_id, route_name, pickup_address, pickup_lat, pickup_lng,
        dropoff_address, dropoff_lat, dropoff_lng, preferred_ride_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        routeName,
        pickup.address,
        pickup.lat,
        pickup.lng,
        dropoff.address,
        dropoff.lat,
        dropoff.lng,
        preferredRideType || 'economy'
      ]
    );
    
    // Check for route master achievement (5+ saved routes)
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM favorite_routes WHERE user_id = $1`,
      [userId]
    );
    
    if (parseInt(countResult.rows[0].count) >= 5) {
      await awardAchievement(userId, 'route_master');
    }
    
    res.status(201).json({
      message: "Favorite route added",
      routeId: result.rows[0].id
    });
  } catch (err) {
    next(err);
  }
}

// Delete favorite route
export async function deleteFavoriteRoute(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { id } = req.params;
    
    const result = await query(
      `DELETE FROM favorite_routes WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    if (result.rowCount === 0) {
      return next(new AppError("Favorite route not found", 404));
    }
    
    res.json({ message: "Favorite route deleted" });
  } catch (err) {
    next(err);
  }
}

// Increment usage count when booking from favorite
export async function incrementFavoriteUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { id } = req.params;
    
    await query(
      `UPDATE favorite_routes 
       SET usage_count = usage_count + 1 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    
    res.json({ message: "Usage updated" });
  } catch (err) {
    next(err);
  }
}

async function awardAchievement(userId: string, achievementCode: string): Promise<void> {
  try {
    const achievement = await query<{ id: string }>(
      `SELECT id FROM achievements WHERE code = $1`,
      [achievementCode]
    );
    
    if (achievement.rows.length > 0) {
      await query(
        `INSERT INTO user_achievements (user_id, achievement_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, achievement_id) DO NOTHING`,
        [userId, achievement.rows[0].id]
      );
    }
  } catch (err) {
    logger.error(`Error awarding achievement ${achievementCode}:`, err);
  }
}
