import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as rideController from "../controllers/ride.controller";
import { bookingRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

// All ride routes require authentication
router.use(authenticate);

router.get("/history",        rideController.getRideHistory);
router.get("/active",         rideController.getActiveRide);
router.get("/available",      rideController.getAvailableRides);     // driver: pending rides
router.get("/stats/rider",    rideController.getRiderStats);
router.get("/stats/driver",   rideController.getDriverStats);
router.get("/driver/active",  rideController.getDriverActiveRide);
router.get("/:id",            rideController.getRideById);
router.post("/estimate",      rideController.estimateFare);
router.post("/",              bookingRateLimiter, rideController.bookRide);
router.patch("/:id/cancel",   rideController.cancelRide);
router.patch("/:id/accept",   rideController.acceptRide);
router.patch("/:id/decline",  rideController.declineRide);
router.patch("/:id/start",    rideController.startRide);
router.patch("/:id/complete", rideController.completeRide);
router.post("/:id/simulate",  rideController.simulateRideProgress);  // Demo: auto-progress ride

export default router;
