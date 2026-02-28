import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { query, withTransaction } from "../config/database";
import { AppError } from "../middleware/error.middleware";

export async function submitReview(req: Request, res: Response, next: NextFunction) {
  try {
    const reviewerId = (req as AuthenticatedRequest).userId;
    const { rideId, rating, comment } = req.body;

    if (!rideId || !rating || rating < 1 || rating > 5) {
      throw new AppError("rideId and a rating between 1-5 are required", 400);
    }

    await withTransaction(async (client) => {
      // Get ride details to know the reviewee
      const rideResult = await client.query(
        `SELECT r.id, r.driver_id, r.rider_id,
                d.user_id AS driver_user_id
         FROM rides r 
         JOIN drivers d ON d.id = r.driver_id
         WHERE r.id = $1`,
        [rideId]
      );
      if (!rideResult.rows.length) throw new AppError("Ride not found", 404);
      const ride = rideResult.rows[0];

      // Verify the reviewer is the rider of this ride
      if (ride.rider_id !== parseInt(reviewerId)) {
        throw new AppError("You can only review your own rides", 403);
      }

      // Check if review already exists
      const existingReview = await client.query(
        `SELECT id FROM reviews WHERE ride_id = $1 AND reviewer_id = $2`,
        [rideId, reviewerId]
      );
      if (existingReview.rows.length > 0) {
        throw new AppError("You have already reviewed this ride", 400);
      }

      // The reviewee is the driver's user_id (rider reviewing driver)
      const revieweeId = ride.driver_user_id;

      // Insert review
      await client.query(
        `INSERT INTO reviews(ride_id, reviewer_id, reviewee_id, rating, comment)
         VALUES($1, $2, $3, $4, $5)`,
        [rideId, reviewerId, revieweeId, rating, comment]
      );

      // Update driver average rating
      await client.query(
        `UPDATE drivers SET rating = (
           SELECT AVG(r2.rating) FROM reviews r2 WHERE r2.reviewee_id = drivers.user_id
         ) WHERE user_id = $1`,
        [revieweeId]
      );
    });

    res.status(201).json({ success: true, message: "Review submitted" });
  } catch (err) {
    next(err);
  }
}

export async function getDriverReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at, 
              u.first_name || ' ' || u.last_name AS rider_name,
              r.pickup_address, r.dropoff_address
       FROM reviews rv 
       JOIN users u ON u.id = rv.reviewer_id
       JOIN drivers d ON d.user_id = rv.reviewee_id
       JOIN rides r ON r.id = rv.ride_id
       WHERE d.id = $1 
       ORDER BY rv.created_at DESC LIMIT 100`,
      [req.params.driverId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getMyDriverReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    const result = await query(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at, 
              u.first_name || ' ' || u.last_name AS rider_name,
              r.pickup_address, r.dropoff_address
       FROM reviews rv 
       JOIN users u ON u.id = rv.reviewer_id
       JOIN drivers d ON d.user_id = rv.reviewee_id
       JOIN rides r ON r.id = rv.ride_id
       WHERE d.user_id = $1 
       ORDER BY rv.created_at DESC LIMIT 100`,
      [userId]
    );
    
    // Calculate overall rating
    const avgResult = await query<{ avg_rating: string; total_reviews: string }>(
      `SELECT AVG(rv.rating)::numeric(3,2) AS avg_rating, COUNT(*) AS total_reviews
       FROM reviews rv 
       JOIN drivers d ON d.user_id = rv.reviewee_id
       WHERE d.user_id = $1`,
      [userId]
    );
    
    res.json({ 
      success: true, 
      data: {
        reviews: result.rows,
        avgRating: parseFloat(avgResult.rows[0]?.avg_rating || '0'),
        totalReviews: parseInt(avgResult.rows[0]?.total_reviews || '0')
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getRiderReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await query(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.name AS reviewer_name
       FROM reviews rv JOIN users u ON u.id = rv.reviewer_id
       WHERE rv.reviewee_id = (SELECT id FROM users WHERE clerk_id = $1)
       ORDER BY rv.created_at DESC LIMIT 20`,
      [req.params.riderId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getMyReviewedRides(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    
    const result = await query(
      `SELECT ride_id FROM reviews WHERE reviewer_id = $1`,
      [userId]
    );
    
    const rideIds = result.rows.map((row: any) => row.ride_id);
    res.json({ success: true, data: rideIds });
  } catch (err) {
    next(err);
  }
}
