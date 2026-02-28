import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as carbonService from "../services/carbon.service";

export async function getCarbonStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const stats = await carbonService.getUserCarbonStats(userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
