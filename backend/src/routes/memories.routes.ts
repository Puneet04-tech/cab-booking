import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as memoriesController from "../controllers/memories.controller";

const router = Router();

router.use(authenticate);

router.get("/", memoriesController.getRideMemories);
router.post("/", memoriesController.saveRideMemory);
router.delete("/:rideId", memoriesController.deleteRideMemory);

export default router;
