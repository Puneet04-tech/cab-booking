import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as preferencesController from "../controllers/preferences.controller";

const router = Router();

router.use(authenticate);

router.get("/", preferencesController.getRidePreferences);
router.put("/", preferencesController.updateRidePreferences);

export default router;
