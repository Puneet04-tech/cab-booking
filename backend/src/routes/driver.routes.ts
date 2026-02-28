import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import * as driverController from "../controllers/driver.controller";

const router = Router();

router.use(authenticate);

router.get("/nearby",           driverController.getNearbyDrivers);
router.get("/registered",      driverController.getRegisteredDrivers); // list all drivers + locations
router.patch("/status",         requireRole("driver"), driverController.updateStatus);
router.patch("/location",       requireRole("driver"), driverController.updateLocation);
// admin route to manually set any driver's location (e.g. for testing)
router.patch("/:id/location",   requireRole("admin"), driverController.setDriverLocation);
router.get("/earnings",         requireRole("driver"), driverController.getEarnings);
router.get("/profile/:id",      driverController.getDriverProfile);
router.put("/vehicle",          requireRole("driver"), driverController.updateVehicle);
router.post("/verify-document", requireRole("driver"), driverController.submitDocument);

export default router;
