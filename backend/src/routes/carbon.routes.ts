import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as carbonController from "../controllers/carbon.controller";

const router = Router();

router.use(authenticate);

router.get("/stats", carbonController.getCarbonStats);

export default router;
