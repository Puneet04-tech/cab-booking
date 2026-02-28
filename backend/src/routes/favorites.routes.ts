import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as favoritesController from "../controllers/favorites.controller";

const router = Router();

router.use(authenticate);

router.get("/", favoritesController.getFavoriteRoutes);
router.post("/", favoritesController.addFavoriteRoute);
router.delete("/:id", favoritesController.deleteFavoriteRoute);
router.post("/:id/use", favoritesController.incrementFavoriteUsage);

export default router;
