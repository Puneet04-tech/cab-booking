import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as userController from "../controllers/user.controller";

const router = Router();

router.use(authenticate);

router.get("/profile",                    userController.getProfile);
router.put("/profile",                    userController.updateProfile);
router.post("/emergency-contacts",        userController.addEmergencyContact);
router.get("/emergency-contacts",         userController.getEmergencyContacts);
router.delete("/emergency-contacts/:id",  userController.removeEmergencyContact);
router.get("/notifications",              userController.getNotifications);
router.patch("/notifications/:id/read",   userController.markNotificationRead);

export default router;
