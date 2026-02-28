import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";
import { AppError } from "../middleware/error.middleware";

export async function validatePromo(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    if (!code) throw new AppError("Promo code is required", 400);

    const result = await query<{
      id: string; code: string; discount_type: string;
      discount_value: number; min_fare: number; max_discount: number;
      expires_at: string; usage_limit: number; usage_count: number; is_active: boolean;
    }>(
      `SELECT * FROM promo_codes WHERE code = UPPER($1) AND is_active = true AND expires_at > NOW()`,
      [code]
    );

    if (!result.rows.length) {
      throw new AppError("Invalid or expired promo code", 400);
    }

    const promo = result.rows[0];
    if (promo.usage_count >= promo.usage_limit) {
      throw new AppError("Promo code has reached its usage limit", 400);
    }

    res.json({
      success: true,
      data: {
        code: promo.code,
        discountType: promo.discount_type,
        discountValue: promo.discount_value,
        minFare: promo.min_fare,
        maxDiscount: promo.max_discount,
      },
    });
  } catch (err) {
    next(err);
  }
}
