import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as sosController from "../controllers/sos.controller";

const router = Router();

router.use(authenticate);
router.post("/trigger", sosController.triggerSOS);
router.get("/history",  sosController.getSOSHistory);

export default router;
