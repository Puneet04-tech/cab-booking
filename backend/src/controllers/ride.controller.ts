import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as rideService from "../services/ride.service";
import * as fareService from "../services/fare.service";
import { AppError } from "../middleware/error.middleware";

export async function estimateFare(req: Request, res: Response, next: NextFunction) {
  try {
    const { pickup, dropoff } = req.body;
    if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) {
      throw new AppError("Pickup and dropoff coordinates are required", 400);
    }
    const estimates = await fareService.estimateAllFares(pickup, dropoff);
    res.json({ success: true, data: estimates });
  } catch (err) {
    next(err);
  }
}

export async function bookRide(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { pickup, dropoff, stops, rideType, paymentMethod, promoCode } = req.body;

    if (!pickup || !dropoff || !rideType) {
      throw new AppError("pickup, dropoff, and rideType are required", 400);
    }

    const ride = await rideService.createRide({
      riderId: userId,
      pickup,
      dropoff,
      stops: stops ?? [],
      rideType,
      paymentMethod,
      promoCode,
    });

    res.status(201).json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

export async function getActiveRide(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const ride = await rideService.getActiveRide(userId);
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

export async function getRideById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const ride = await rideService.getRideById(req.params.id, userId);
    if (!ride) throw new AppError("Ride not found", 404);
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

export async function getRideHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const page  = parseInt(req.query.page  as string ?? "1");
    const limit = parseInt(req.query.limit as string ?? "10");
    const data = await rideService.getRideHistory(userId, page, limit);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function cancelRide(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { reason } = req.body;
    const ride = await rideService.cancelRide(req.params.id, userId, reason);
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

export async function acceptRide(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = (req as AuthenticatedRequest).userId;
    const ride = await rideService.acceptRide(req.params.id, driverId);
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

export async function declineRide(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = (req as AuthenticatedRequest).userId;
    await rideService.declineRide(req.params.id, driverId);
    res.json({ success: true, message: "Ride declined" });
  } catch (err) {
    next(err);
  }
}

export async function completeRide(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = (req as AuthenticatedRequest).userId;
    const ride = await rideService.completeRide(req.params.id, driverId);
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

export async function startRide(req: Request, res: Response, next: NextFunction) {
  try {
    const driverId = (req as AuthenticatedRequest).userId;
    const ride = await rideService.startRide(req.params.id, driverId);
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

export async function getAvailableRides(req: Request, res: Response, next: NextFunction) {
  try {
    const rides = await rideService.getAvailableRides();
    res.json({ success: true, data: rides });
  } catch (err) {
    next(err);
  }
}

export async function getRiderStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const data = await rideService.getRiderStats(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getDriverStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const data = await rideService.getDriverStats(userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getDriverActiveRide(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const ride = await rideService.getDriverActiveRide(userId);
    res.json({ success: true, data: ride });
  } catch (err) {
    next(err);
  }
}

// Development endpoint: Auto-simulate ride lifecycle for demo
export async function simulateRideProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { rideId } = req.params;
    
    // Start background simulation
    rideService.autoProgressRide(rideId).catch(console.error);
    
    res.json({ 
      success: true, 
      message: "Ride simulation started. Status will auto-update: searching → accepted → in_progress → completed" 
    });
  } catch (err) {
    next(err);
  }
}
