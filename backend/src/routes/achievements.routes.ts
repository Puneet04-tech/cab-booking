import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as achievementsController from "../controllers/achievements.controller";

const router = Router();

router.use(authenticate);

router.get("/", achievementsController.getUserAchievements);
router.get("/stats", achievementsController.getAchievementStats);

export default router;
