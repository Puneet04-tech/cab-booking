import { Router } from "express";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";
import { authenticate } from "../middleware/auth.middleware";
import * as authController from "../controllers/auth.controller";

const router = Router();

// Public
router.post("/register", authRateLimiter, authController.register);
router.post("/login",    authRateLimiter, authController.login);

// Protected
router.get("/me", authenticate, authController.me);

export default router;
