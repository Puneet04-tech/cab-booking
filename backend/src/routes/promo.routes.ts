import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as promoController from "../controllers/promo.controller";

const router = Router();

router.use(authenticate);
router.post("/validate", promoController.validatePromo);

export default router;
