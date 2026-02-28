import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import stripeClient from "../config/stripe";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { query, withTransaction } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import * as emailService from "../services/email.service";
import logger from "../utils/logger";

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { rideId } = req.body;
    if (!rideId) throw new AppError("rideId is required", 400);

    // Fetch ride
    const rideResult = await query<{ id: string; estimated_fare: number; final_fare: number; rider_id: string }>(
      "SELECT id, estimated_fare, final_fare, rider_id FROM rides WHERE id = $1",
      [rideId]
    );
    if (!rideResult.rows.length) throw new AppError("Ride not found", 404);
    const ride = rideResult.rows[0];

    const amount = Math.round((ride.final_fare ?? ride.estimated_fare) * 100); // cents

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { rideId, userId },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ success: true, data: { clientSecret: paymentIntent.client_secret } });
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    logger.warn("Stripe webhook signature verification failed:", err);
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const { rideId } = pi.metadata;

      await withTransaction(async (client) => {
        await client.query(
          "UPDATE payments SET status = 'succeeded' WHERE stripe_payment_intent_id = $1",
          [pi.id]
        );
        await client.query(
          "UPDATE rides SET payment_status = 'paid' WHERE id = $1",
          [rideId]
        );
      });
      
      // Receipt will be sent when ride completes
    }

    res.json({ received: true });
  } catch (err) {
    logger.error("Error processing Stripe webhook:", err);
    res.status(500).json({ error: "Webhook processing error" });
  }
}

export async function getSavedCards(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query(
      `SELECT id, last4, brand, expiry_month, expiry_year, is_default
       FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function addCard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { number, expiry, cvv, name } = req.body;

    // Validate input
    if (!number || !expiry || !cvv || !name) {
      throw new AppError("All card fields are required", 400);
    }

    // Validate card number (basic validation)
    const cardNumber = number.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(cardNumber)) {
      throw new AppError("Invalid card number", 400);
    }

    // Parse expiry (MM/YY or MM/YYYY format)
    const expiryParts = expiry.split("/").map((p: string) => p.trim());
    if (expiryParts.length !== 2) {
      throw new AppError("Invalid expiry format. Use MM/YY", 400);
    }
    const expiryMonth = parseInt(expiryParts[0]);
    let expiryYear = parseInt(expiryParts[1]);
    
    // Convert 2-digit year to 4-digit
    if (expiryYear < 100) {
      expiryYear += 2000;
    }

    if (expiryMonth < 1 || expiryMonth > 12) {
      throw new AppError("Invalid expiry month", 400);
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      throw new AppError("Invalid CVV", 400);
    }

    // Get last 4 digits
    const last4 = cardNumber.slice(-4);
    
    // Detect card brand
    let brand = "Unknown";
    if (/^4/.test(cardNumber)) brand = "Visa";
    else if (/^5[1-5]/.test(cardNumber)) brand = "Mastercard";
    else if (/^3[47]/.test(cardNumber)) brand = "Amex";
    else if (/^6(?:011|5)/.test(cardNumber)) brand = "Discover";

    // In production, this would create a Stripe payment method
    // For demo, we'll simulate a Stripe PM ID
    const stripePmId = `pm_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if this is the user's first card to make it default
    const existingCards = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM payment_methods WHERE user_id = $1`,
      [userId]
    );
    const isDefault = existingCards.rows[0].count === "0";

    // Insert card
    const result = await query(
      `INSERT INTO payment_methods (user_id, stripe_pm_id, last4, brand, expiry_month, expiry_year, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, last4, brand, expiry_month, expiry_year, is_default`,
      [userId, stripePmId, last4, brand, expiryMonth, expiryYear, isDefault]
    );

    res.json({ 
      success: true, 
      message: "Card added successfully",
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
}

export async function removeCard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    await query(
      `DELETE FROM payment_methods WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );
    res.json({ success: true, message: "Card removed" });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query(
      `SELECT 
         r.id AS ride_id,
         r.pickup_address,
         r.dropoff_address,
         r.final_fare,
         r.estimated_fare,
         r.payment_method,
         r.completed_at,
         r.created_at,
         r.status
       FROM rides r
       WHERE r.rider_id = $1 AND r.status IN ('completed', 'cancelled')
       ORDER BY COALESCE(r.completed_at, r.created_at) DESC
       LIMIT 50`,
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function getReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query<{
      id: string;
      pickup_address: string;
      dropoff_address: string;
      ride_type: string;
      distance_km: number;
      duration_minutes: number;
      estimated_fare: number;
      final_fare: number;
      payment_method: string;
      promo_code: string | null;
      discount_amount: number;
      completed_at: string;
      created_at: string;
      rider_name: string;
      rider_email: string;
      driver_name: string;
      payment_status: string;
    }>(
      `SELECT 
        r.id,
        r.pickup_address,
        r.dropoff_address,
        r.ride_type,
        COALESCE(r.distance_km, 10.0) AS distance_km,
        COALESCE(r.duration_minutes, 20) AS duration_minutes,
        r.estimated_fare,
        r.final_fare,
        r.payment_method,
        r.promo_code,
        COALESCE(r.discount_amount, 0) AS discount_amount,
        r.completed_at,
        r.created_at,
        rider.first_name || ' ' || rider.last_name AS rider_name,
        rider.email AS rider_email,
        COALESCE(driver_user.first_name || ' ' || driver_user.last_name, 'Driver') AS driver_name,
        p.status AS payment_status
       FROM rides r 
       JOIN users rider ON rider.id = r.rider_id
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users driver_user ON driver_user.id = d.user_id
       LEFT JOIN payments p ON p.ride_id = r.id
       WHERE r.id = $1 AND r.rider_id = $2 AND r.status = 'completed'`,
      [req.params.rideId, userId]
    );
    if (!result.rows.length) throw new AppError("Receipt not found", 404);

    // fetch stops for the ride
    const stopsRes = await query<{ address: string }>(
      "SELECT address FROM ride_stops WHERE ride_id = $1 ORDER BY stop_order",
      [req.params.rideId]
    );
    const stops = stopsRes.rows.map(r => r.address);
    
    const ride = result.rows[0];
    
    // Calculate fare breakdown (base fare, distance, time)
    const baseFare = 2.50;
    const farePerKm = 1.20;
    const farePerMin = 0.30;
    
    const distanceFare = (ride.distance_km || 0) * farePerKm;
    const timeFare = (ride.duration_minutes || 0) * farePerMin;
    
    res.json({ 
      success: true, 
      data: {
        ...ride,
        baseFare,
        distanceFare,
        timeFare,
        subtotal: baseFare + distanceFare + timeFare
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function resendReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { rideId } = req.params;

    // Get complete ride details
    const rideResult = await query<{
      id: string;
      rider_id: string;
      rider_name: string;
      rider_email: string;
      driver_name: string;
      pickup_address: string;
      dropoff_address: string;
      ride_type: string;
      distance_km: number;
      duration_minutes: number;
      final_fare: number;
      discount_amount: number;
      promo_code: string | null;
      payment_method: string;
      completed_at: Date;
      status: string;
    }>(
      `SELECT 
        r.id,
        r.rider_id,
        rider.first_name || ' ' || rider.last_name AS rider_name,
        rider.email AS rider_email,
        COALESCE(driver_user.first_name || ' ' || driver_user.last_name, 'Driver') AS driver_name,
        r.pickup_address,
        r.dropoff_address,
        r.ride_type,
        COALESCE(r.distance_km, 10.0) AS distance_km,
        COALESCE(r.duration_minutes, 20) AS duration_minutes,
        r.final_fare,
        COALESCE(r.discount_amount, 0) AS discount_amount,
        r.promo_code,
        r.payment_method,
        r.completed_at,
        r.status
       FROM rides r
       JOIN users rider ON rider.id = r.rider_id
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users driver_user ON driver_user.id = d.user_id
       WHERE r.id = $1 AND r.rider_id = $2 AND r.status = 'completed'`,
      [rideId, userId]
    );

    if (!rideResult.rows.length) {
      throw new AppError("Completed ride not found", 404);
    }

    const ride = rideResult.rows[0];

    // Calculate fare breakdown
    const baseFare = 2.50;
    const farePerKm = 1.20;
    const farePerMin = 0.30;
    
    const distanceFare = ride.distance_km * farePerKm;
    const timeFare = ride.duration_minutes * farePerMin;

    // Send receipt email
    await emailService.sendReceipt(ride.rider_email, {
      rideId: ride.id,
      riderName: ride.rider_name,
      driverName: ride.driver_name,
      pickupAddress: ride.pickup_address,
      dropoffAddress: ride.dropoff_address,
      rideType: ride.ride_type,
      distanceKm: ride.distance_km,
      durationMinutes: ride.duration_minutes,
      baseFare,
      distanceFare,
      timeFare,
      discountAmount: ride.discount_amount,
      promoCode: ride.promo_code || undefined,
      finalFare: ride.final_fare,
      paymentMethod: ride.payment_method,
      completedAt: ride.completed_at
    });

    res.json({ 
      success: true, 
      message: "Receipt sent successfully",
      email: ride.rider_email 
    });
  } catch (err) {
    next(err);
  }
}

export async function getWalletBalance(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const result = await query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId]
    );
    if (!result.rows.length) throw new AppError("User not found", 404);
    res.json({ success: true, data: { balance: parseFloat(result.rows[0].wallet_balance) } });
  } catch (err) {
    next(err);
  }
}

export async function topUpWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { amount } = req.body;
    if (!amount || amount <= 0) throw new AppError("Valid amount is required", 400);

    const result = await query<{ wallet_balance: string }>(
      `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance`,
      [amount, userId]
    );
    res.json({ success: true, message: `Wallet topped up by $${amount}`, data: { balance: parseFloat(result.rows[0].wallet_balance) } });
  } catch (err) {
    next(err);
  }
}

export async function deductFromWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { rideId, amount } = req.body;
    
    if (!rideId || !amount || amount <= 0) {
      throw new AppError("rideId and valid amount are required", 400);
    }

    // Verify ride belongs to user
    const rideResult = await query<{ 
      id: string; 
      rider_id: string; 
      final_fare: string; 
      estimated_fare: string; 
      status: string 
    }>(
      `SELECT id, rider_id, final_fare, estimated_fare, status FROM rides WHERE id = $1`,
      [rideId]
    );
    
    if (!rideResult.rows.length) {
      throw new AppError("Ride not found", 404);
    }

    const ride = rideResult.rows[0];
    if (ride.rider_id !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    // Get current balance
    const userResult = await query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId]
    );

    const currentBalance = parseFloat(userResult.rows[0].wallet_balance);
    if (currentBalance < amount) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    // Deduct from wallet and update ride payment status
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
        [amount, userId]
      );
      
      // Update payment status to 'paid' and ride status to 'searching' (ready for drivers)
      await client.query(
        `UPDATE rides SET payment_status = 'paid', payment_method = 'wallet', status = 'searching' WHERE id = $1`,
        [rideId]
      );
    });

    const newBalanceResult = await query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId]
    );

    res.json({ 
      success: true, 
      message: `Payment of $${amount} processed successfully`,
      data: { 
        balance: parseFloat(newBalanceResult.rows[0].wallet_balance),
        rideId 
      } 
    });
  } catch (err) {
    next(err);
  }
}

export async function processRidePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { rideId } = req.body;
    
    if (!rideId) {
      throw new AppError("rideId is required", 400);
    }

    // Get ride details
    const rideResult = await query<{ 
      id: string; 
      rider_id: string; 
      final_fare: string;
      estimated_fare: string;
      status: string;
    }>(
      `SELECT id, rider_id, final_fare, estimated_fare, status FROM rides WHERE id = $1`,
      [rideId]
    );
    
    if (!rideResult.rows.length) {
      throw new AppError("Ride not found", 404);
    }

    const ride = rideResult.rows[0];
    if (ride.rider_id !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    const amount = parseFloat(ride.final_fare) || parseFloat(ride.estimated_fare);

    // Get wallet balance
    const userResult = await query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId]
    );

    const currentBalance = parseFloat(userResult.rows[0].wallet_balance);
    if (currentBalance < amount) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    // Process payment
    await withTransaction(async (client) => {
      await client.query(
        `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
        [amount, userId]
      );
      
      await client.query(
        `UPDATE rides SET payment_status = 'paid', payment_method = 'wallet' WHERE id = $1`,
        [rideId]
      );

      // Create payment record (driver gets 85% of the amount)
      const driverAmount = amount * 0.85;
      await client.query(
        `INSERT INTO payments (ride_id, user_id, amount, driver_amount, status) 
         VALUES ($1, $2, $3, $4, 'succeeded')`,
        [rideId, userId, amount, driverAmount]
      );
    });

    const newBalanceResult = await query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId]
    );

    res.json({ 
      success: true, 
      message: "Payment processed successfully",
      data: { 
        balance: parseFloat(newBalanceResult.rows[0].wallet_balance),
        amount,
        rideId 
      } 
    });
  } catch (err) {
    next(err);
  }
}
