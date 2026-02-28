import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as reviewController from "../controllers/review.controller";

const router = Router();

router.use(authenticate);

router.post("/",                   reviewController.submitReview);
router.get("/driver/me",           reviewController.getMyDriverReviews);
router.get("/rider/me/reviewed",   reviewController.getMyReviewedRides);
router.get("/driver/:driverId",    reviewController.getDriverReviews);
router.get("/rider/:riderId",      reviewController.getRiderReviews);

export default router;
