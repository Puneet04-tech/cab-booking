import { query, withTransaction } from "../config/database";
import { AppError } from "../middleware/error.middleware";
import * as fareService from "./fare.service";
import * as notificationService from "./notification.service";
import * as emailService from "./email.service";
import * as carbonService from "./carbon.service";
import { v4 as uuidv4 } from "uuid";

interface CreateRideInput {
  riderId: string;  // users.id from JWT
  pickup: { address: string; lat: number; lng: number };
  dropoff: { address: string; lat: number; lng: number };
  stops?: { address: string; lat: number; lng: number }[];
  rideType: string;
  paymentMethod: string;
  promoCode?: string;
}

// Helper function to find nearest available driver
async function findNearestDriver(
  pickupLat: number,
  pickupLng: number,
  rideType: string
): Promise<{ id: string; user_id: string; distance_km: number } | null> {
  try {
    const result = await query<{ id: string; user_id: string; distance_km: number }>(
      `SELECT d.id, d.user_id,
              (6371 * acos(cos(radians($1)) * cos(radians(d.current_lat)) *
               cos(radians(d.current_lng) - radians($2)) +
               sin(radians($1)) * sin(radians(d.current_lat)))) AS distance_km
       FROM drivers d
       WHERE d.status = 'online'
         AND d.current_lat IS NOT NULL
         AND d.current_lng IS NOT NULL
         AND (d.vehicle_type = $3 OR d.vehicle_type IS NULL)
       ORDER BY distance_km
       LIMIT 1`,
      [pickupLat, pickupLng, rideType]
    );

    if (result.rows.length > 0 && result.rows[0].distance_km <= 10) {
      // Only assign if driver is within 10km
      return result.rows[0];
    }
    return null;
  } catch (err) {
    console.error("Error finding nearest driver:", err);
    return null;
  }
}

export async function createRide(input: CreateRideInput) {
  const { riderId, pickup, dropoff, stops, rideType, paymentMethod, promoCode } = input;

  // Calculate fare
  const fareEstimate = await fareService.estimateFare(
    { lat: pickup.lat, lng: pickup.lng },
    { lat: dropoff.lat, lng: dropoff.lng },
    rideType as "economy" | "premium" | "suv" | "auto"
  );

  // Find nearest available driver
  const nearestDriver = await findNearestDriver(pickup.lat, pickup.lng, rideType);

  // Apply promo discount if provided
  let discountAmount = 0;
  if (promoCode) {
    const promoResult = await query<{ discount_type: string; discount_value: number; max_discount: number }>(
      "SELECT discount_type, discount_value, max_discount FROM promo_codes WHERE code = UPPER($1) AND is_active = true",
      [promoCode]
    );
    if (promoResult.rows.length) {
      const promo = promoResult.rows[0];
      if (promo.discount_type === "percentage") {
        discountAmount = Math.min(
          fareEstimate.estimatedFare * (promo.discount_value / 100),
          promo.max_discount ?? Infinity
        );
      } else {
        discountAmount = promo.discount_value;
      }
      // Increment usage count
      await query("UPDATE promo_codes SET usage_count = usage_count + 1 WHERE code = UPPER($1)", [promoCode]);
    }
  }

  const finalEstimatedFare = Math.max(fareEstimate.estimatedFare - discountAmount, 0);

  return withTransaction(async (client) => {
    const rideId = uuidv4();

    // For cash payment, ride goes to 'searching' immediately (no upfront payment needed)
    // For wallet/card, ride stays 'pending' until payment is processed
    const initialStatus = paymentMethod === 'cash' ? 'searching' : 'pending';

    // Create ride with assigned driver if available
    const rideResult = await client.query<{ id: string; status: string; estimated_fare: number }>(
      `INSERT INTO rides(
         id, rider_id, pickup_address, pickup_lat, pickup_lng,
         dropoff_address, dropoff_lat, dropoff_lng,
         ride_type, estimated_fare, payment_method, promo_code, discount_amount, status, driver_id
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id, status, estimated_fare`,
      [
        rideId, riderId,
        pickup.address, pickup.lat, pickup.lng,
        dropoff.address, dropoff.lat, dropoff.lng,
        rideType, finalEstimatedFare, paymentMethod, promoCode ?? null, discountAmount, 
        nearestDriver ? 'accepted' : initialStatus,
        nearestDriver?.id ?? null
      ]
    );
    
    // If driver was auto-assigned, update driver status to busy
    if (nearestDriver) {
      await client.query(
        `UPDATE drivers SET status = 'busy' WHERE id = $1`,
        [nearestDriver.id]
      );
      
      // Notify the assigned driver
      notificationService.notifyDriverAssignment(
        nearestDriver.user_id,
        rideId,
        pickup.address,
        dropoff.address
      ).catch(console.error);
    }

    // Insert stops if any
    if (stops?.length) {
      for (let i = 0; i < stops.length; i++) {
        await client.query(
          "INSERT INTO ride_stops(ride_id, address, lat, lng, stop_order) VALUES($1,$2,$3,$4,$5)",
          [rideId, stops[i].address, stops[i].lat, stops[i].lng, i + 1]
        );
      }
    }

    // Notify nearby drivers (async, non-blocking)
    notificationService.notifyNearbyDrivers(
      { lat: pickup.lat, lng: pickup.lng },
      rideId,
      rideType
    ).catch(console.error);

    // Send email notifications to available drivers (async, non-blocking)
    sendRideNotificationsToDrivers(
      rideId,
      pickup.address,
      dropoff.address,
      finalEstimatedFare,
      rideType
    ).catch(console.error);

    return rideResult.rows[0];
  });
}

// Helper function to send email notifications to available drivers
async function sendRideNotificationsToDrivers(
  rideId: string,
  pickupAddress: string,
  dropoffAddress: string,
  estimatedFare: number,
  rideType: string
): Promise<void> {
  try {
    // Get available drivers (online/available status) with their email addresses
    const driversResult = await query<{ 
      email: string; 
      first_name: string; 
      last_name: string 
    }>(
      `SELECT u.email, u.first_name, u.last_name
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       WHERE d.status IN ('online', 'available') 
         AND u.is_active = true
         AND u.email IS NOT NULL
       LIMIT 50`,
      []
    );

    // Send emails to all available drivers
    const emailPromises = driversResult.rows.map((driver) => {
      const driverName = `${driver.first_name} ${driver.last_name}`.trim() || "Driver";
      return emailService.sendRideNotificationEmail(
        driver.email,
        driverName,
        {
          rideId,
          pickupAddress,
          dropoffAddress,
          estimatedFare,
          rideType,
        }
      );
    });

    await Promise.all(emailPromises);
    console.log(`Sent ride notifications to ${driversResult.rows.length} drivers for ride ${rideId}`);
  } catch (err) {
    console.error("Failed to send ride notification emails:", err);
  }
}

// helper to attach stops addresses to a ride object
async function attachRideStops(ride: any): Promise<any> {
  if (!ride || !ride.id) return ride;
  const stopsRes = await query<{ address: string }>(
    `SELECT address FROM ride_stops WHERE ride_id = $1 ORDER BY stop_order`,
    [ride.id]
  );
  ride.stops = stopsRes.rows.map(r => r.address);
  return ride;
}

export async function getActiveRide(userId: string) {
  const result = await query(
    `SELECT r.*,
            u_driver.first_name || ' ' || u_driver.last_name AS driver_name
     FROM rides r
     LEFT JOIN drivers d ON d.id = r.driver_id
     LEFT JOIN users u_driver ON u_driver.id = d.user_id
     WHERE r.rider_id = $1 AND r.status IN ('pending','searching','accepted','driver_arriving','in_progress')
     ORDER BY r.created_at DESC LIMIT 1`,
    [userId]
  );
  const ride = result.rows[0] ?? null;
  return attachRideStops(ride);
}

export async function getRideById(rideId: string, userId: string) {
  const result = await query(
    `SELECT r.*,
            u_rider.first_name || ' ' || u_rider.last_name AS rider_name,
            u_driver.first_name || ' ' || u_driver.last_name AS driver_name
     FROM rides r
     JOIN users u_rider ON u_rider.id = r.rider_id
     LEFT JOIN drivers d ON d.id = r.driver_id
     LEFT JOIN users u_driver ON u_driver.id = d.user_id
     WHERE r.id = $1 AND (r.rider_id = $2 OR d.user_id = $2)`,
    [rideId, userId]
  );
  const ride = result.rows[0] ?? null;
  return attachRideStops(ride);
}

export async function getRideHistory(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT r.id, r.status, r.pickup_address, r.dropoff_address, r.ride_type,
              r.estimated_fare, r.final_fare, r.created_at, r.completed_at,
              r.distance_km, r.duration_minutes, r.payment_method,
              u_driver.first_name || ' ' || u_driver.last_name AS driver_name
       FROM rides r
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users u_driver ON u_driver.id = d.user_id
       WHERE r.rider_id = $1
       ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    query<{ count: string }>(
      "SELECT COUNT(*) FROM rides WHERE rider_id = $1",
      [userId]
    ),
  ]);

  const total = parseInt(countResult.rows[0].count, 10);
  return { data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getRiderStats(userId: string) {
  const [statsResult, recentResult] = await Promise.all([
    query<{ total_rides: string; completed_rides: string; total_spent: string; total_saved: string }>(
      `SELECT
         COUNT(*) AS total_rides,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed_rides,
         COALESCE(SUM(COALESCE(final_fare, estimated_fare)) FILTER (WHERE status = 'completed'), 0) AS total_spent,
         COALESCE(SUM(discount_amount), 0) AS total_saved
       FROM rides WHERE rider_id = $1`,
      [userId]
    ),
    query(
      `SELECT r.id, r.status, r.pickup_address, r.dropoff_address, r.ride_type,
              r.estimated_fare, r.final_fare, r.created_at,
              u_driver.first_name || ' ' || u_driver.last_name AS driver_name
       FROM rides r
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users u_driver ON u_driver.id = d.user_id
       WHERE r.rider_id = $1
       ORDER BY r.created_at DESC LIMIT 5`,
      [userId]
    ),
  ]);
  return { stats: statsResult.rows[0], recentRides: recentResult.rows };
}

export async function getAvailableRides() {
  const result = await query(
    `SELECT r.id, r.pickup_address, r.dropoff_address, r.ride_type,
            r.estimated_fare, r.distance_km, r.created_at,
            u.first_name || ' ' || u.last_name AS rider_name,
            u.rating AS rider_rating,
            r.pickup_lat, r.pickup_lng, r.dropoff_lat, r.dropoff_lng
     FROM rides r
     JOIN users u ON u.id = r.rider_id
     WHERE r.status IN ('pending', 'searching')
     ORDER BY r.created_at ASC
     LIMIT 20`
  );
  return result.rows;
}

export async function getDriverStats(userId: string) {
  const [driverResult, todayResult, recentResult] = await Promise.all([
    query<{ id: string; total_earnings: string; total_rides: string; rating: string; status: string }>(
      `SELECT d.id, d.total_earnings, d.total_rides, d.rating, d.status
       FROM drivers d WHERE d.user_id = $1`,
      [userId]
    ),
    query<{ today_earnings: string; today_rides: string }>(
      `SELECT
         COALESCE(SUM(r.final_fare), 0) AS today_earnings,
         COUNT(*) FILTER (WHERE r.status = 'completed') AS today_rides
       FROM rides r
       JOIN drivers d ON d.id = r.driver_id
       WHERE d.user_id = $1 AND r.created_at >= CURRENT_DATE`,
      [userId]
    ),
    query(
      `SELECT r.id, r.status, r.pickup_address, r.dropoff_address,
              r.final_fare, r.estimated_fare, r.created_at, r.completed_at,
              u.first_name || ' ' || u.last_name AS rider_name
       FROM rides r
       JOIN drivers d ON d.id = r.driver_id
       JOIN users u ON u.id = r.rider_id
       WHERE d.user_id = $1 AND r.status IN ('completed','in_progress','accepted')
       ORDER BY r.created_at DESC LIMIT 10`,
      [userId]
    ),
  ]);
  return { driver: driverResult.rows[0] ?? null, today: todayResult.rows[0], recentRides: recentResult.rows };
}

export async function getDriverActiveRide(userId: string) {
  const result = await query(
    `SELECT r.*,
            u.first_name || ' ' || u.last_name AS rider_name,
            u.phone AS rider_phone
     FROM rides r
     JOIN drivers d ON d.id = r.driver_id
     JOIN users u ON u.id = r.rider_id
     WHERE d.user_id = $1 AND r.status IN ('accepted','driver_arriving','in_progress')
     ORDER BY r.updated_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function cancelRide(rideId: string, userId: string, reason?: string) {
  const result = await query<{ created_at: string; status: string }>(
    "SELECT created_at, status FROM rides WHERE id = $1 AND rider_id = $2",
    [rideId, userId]
  );
  if (!result.rows.length) throw new AppError("Ride not found", 404);
  if (result.rows[0].status === "completed") throw new AppError("Cannot cancel a completed ride", 400);

  const updatedResult = await query(
    `UPDATE rides SET status = 'cancelled', cancellation_reason = $1, cancelled_by = 'rider', updated_at = NOW()
     WHERE id = $2 RETURNING id, status`,
    [reason ?? null, rideId]
  );
  return updatedResult.rows[0];
}

export async function acceptRide(rideId: string, driverUserId: string) {
  const driverResult = await query<{ id: string }>(
    "SELECT id FROM drivers WHERE user_id = $1",
    [driverUserId]
  );
  if (!driverResult.rows.length) throw new AppError("Driver record not found", 404);

  const driverDbId = driverResult.rows[0].id;
  const result = await query(
    `UPDATE rides SET driver_id = $1, status = 'accepted', accepted_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND status IN ('pending', 'searching')
     RETURNING id, status, driver_id, rider_id`,
    [driverDbId, rideId]
  );
  if (!result.rows.length) throw new AppError("Ride is no longer available", 409);

  // Mark driver as busy
  await query("UPDATE drivers SET status = 'busy', updated_at = NOW() WHERE user_id = $1", [driverUserId]);

  const ride = result.rows[0] as { id: string; status: string; driver_id: string; rider_id: string };
  await notificationService.createNotification(
    ride.rider_id,
    "ride_accepted",
    "Your driver has accepted the ride and is on the way!"
  );
  return ride;
}

export async function startRide(rideId: string, driverUserId: string) {
  const result = await query(
    `UPDATE rides SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'accepted'
     AND driver_id = (SELECT id FROM drivers WHERE user_id = $2)
     RETURNING id, status`,
    [rideId, driverUserId]
  );
  if (!result.rows.length) throw new AppError("Ride not found or cannot be started", 400);
  return result.rows[0];
}

export async function declineRide(_rideId: string, _driverUserId: string) {
  // Driver declined – keep ride as pending for another driver
  return;
}

export async function completeRide(rideId: string, driverUserId: string) {
  const result = await query<{ 
    id: string; 
    status: string; 
    final_fare: number; 
    rider_id: string;
    distance_km: number;
    duration_minutes: number;
  }>(
    `UPDATE rides SET status = 'completed', completed_at = NOW(), updated_at = NOW(),
     final_fare = estimated_fare,
     distance_km = CASE WHEN distance_km IS NULL THEN 5.0 + (RANDOM() * 15) ELSE distance_km END,
     duration_minutes = CASE WHEN duration_minutes IS NULL THEN 10 + (RANDOM() * 30)::INTEGER ELSE duration_minutes END
     WHERE id = $1 AND status = 'in_progress'
     AND driver_id = (SELECT id FROM drivers WHERE user_id = $2)
     RETURNING id, status, final_fare, rider_id, distance_km, duration_minutes`,
    [rideId, driverUserId]
  );
  if (!result.rows.length) throw new AppError("Ride not found or not in progress", 400);

  const ride = result.rows[0];

  // Update driver stats & set back to online
  await query(
    `UPDATE drivers SET status = 'online', total_rides = total_rides + 1,
     total_earnings = total_earnings + $1, updated_at = NOW()
     WHERE user_id = $2`,
    [ride.final_fare, driverUserId]
  );

  // Update rider stats
  await query(
    "UPDATE users SET total_rides = total_rides + 1, updated_at = NOW() WHERE id = $1",
    [ride.rider_id]
  );

  // Create payment record
  await query(
    `INSERT INTO payments(ride_id, user_id, amount, driver_amount, status, currency)
     VALUES($1, $2, $3, $4, 'succeeded', 'usd')`,
    [rideId, ride.rider_id, ride.final_fare, ride.final_fare * 0.85]
  );

  await notificationService.createNotification(
    ride.rider_id,
    "ride_completed",
    `Your ride is complete! Fare: $${ride.final_fare}`
  );

  // Send detailed receipt email
  try {
    const receiptData = await query<{
      ride_id: string;
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
    }>(
      `SELECT 
        r.id AS ride_id,
        rider.first_name || ' ' || rider.last_name AS rider_name,
        rider.email AS rider_email,
        driver_user.first_name || ' ' || driver_user.last_name AS driver_name,
        r.pickup_address,
        r.dropoff_address,
        r.ride_type,
        r.distance_km,
        r.duration_minutes,
        r.final_fare,
        r.discount_amount,
        r.promo_code,
        r.payment_method,
        r.completed_at
       FROM rides r
       JOIN users rider ON rider.id = r.rider_id
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users driver_user ON driver_user.id = d.user_id
       WHERE r.id = $1`,
      [rideId]
    );

    if (receiptData.rows.length) {
      const data = receiptData.rows[0];
      
      // Calculate fare breakdown
      const baseFare = 2.50;
      const farePerKm = 1.20;
      const farePerMin = 0.30;
      
      const distanceFare = data.distance_km * farePerKm;
      const timeFare = data.duration_minutes * farePerMin;

      await emailService.sendReceipt(data.rider_email, {
        rideId: data.ride_id,
        riderName: data.rider_name,
        driverName: data.driver_name || 'Your Driver',
        pickupAddress: data.pickup_address,
        dropoffAddress: data.dropoff_address,
        rideType: data.ride_type,
        distanceKm: data.distance_km,
        durationMinutes: data.duration_minutes,
        baseFare,
        distanceFare,
        timeFare,
        discountAmount: data.discount_amount || 0,
        promoCode: data.promo_code || undefined,
        finalFare: data.final_fare,
        paymentMethod: data.payment_method,
        completedAt: data.completed_at
      });
    }
  } catch (emailError) {
    // Don't fail the ride completion if email fails
    console.error('Failed to send receipt email:', emailError);
  }

  // Calculate and save carbon footprint
  try {
    const rideDetails = await query<{ ride_type: string }>(
      `SELECT ride_type FROM rides WHERE id = $1`,
      [rideId]
    );
    
    if (rideDetails.rows.length > 0) {
      await carbonService.calculateAndSaveCarbonFootprint(
        ride.rider_id.toString(),
        rideId,
        rideDetails.rows[0].ride_type,
        ride.distance_km
      );
    }
  } catch (carbonError) {
    console.error('Failed to calculate carbon footprint:', carbonError);
  }

  return ride;
}

// Auto-progress ride for demo/testing purposes
export async function autoProgressRide(rideId: string) {
  try {
    // Get ride details
    const rideResult = await query<{ id: string; status: string; rider_id: string; estimated_fare: number }>(
      "SELECT id, status, rider_id, estimated_fare FROM rides WHERE id = $1",
      [rideId]
    );
    
    if (!rideResult.rows.length) {
      console.error("Ride not found:", rideId);
      return;
    }

    const ride = rideResult.rows[0];
    
    // Only auto-progress rides in 'searching' status
    if (ride.status !== 'searching') {
      console.log("Ride not in searching status, skipping auto-progress");
      return;
    }

    // Get or create a demo driver
    let driverResult = await query<{ user_id: string; id: string }>(
      "SELECT user_id, id FROM drivers WHERE status = 'online' LIMIT 1"
    );

    let driverDbId: string;
    let driverUserId: string;

    if (driverResult.rows.length === 0) {
      // Create demo driver if none exists
      const userRes = await query<{ id: string }>(
        `INSERT INTO users(first_name, last_name, email, phone, password_hash, role)
         VALUES('Demo', 'Driver', 'demo.driver@rideswift.com', '+1234567890', '$2a$10$dummyhash', 'driver')
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`
      );
      driverUserId = userRes.rows[0].id;

      const driverRes = await query<{ id: string }>(
        `INSERT INTO drivers(user_id, license_number, vehicle_make, vehicle_model, vehicle_year, vehicle_plate, status)
         VALUES($1, 'DEMO123', 'Toyota', 'Camry', 2023, 'DEMO-001', 'online')
         ON CONFLICT (user_id) DO UPDATE SET status = 'online'
         RETURNING id`,
        [driverUserId]
      );
      driverDbId = driverRes.rows[0].id;
    } else {
      driverDbId = driverResult.rows[0].id;
      driverUserId = driverResult.rows[0].user_id;
    }

    // Step 1: Accept ride (searching → accepted)
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
    await query(
      `UPDATE rides SET driver_id = $1, status = 'accepted', accepted_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [driverDbId, rideId]
    );
    console.log(`Ride ${rideId}: searching → accepted`);

    // Step 2: Start ride (accepted → in_progress)
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
    await query(
      `UPDATE rides SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [rideId]
    );
    console.log(`Ride ${rideId}: accepted → in_progress`);

    // Step 3: Complete ride (in_progress → completed)
    await new Promise(resolve => setTimeout(resolve, 8000)); // 8 second delay
    
    // Add random distance and duration for realism
    const distance = 5.0 + (Math.random() * 15); // 5-20 km
    const duration = 10 + Math.floor(Math.random() * 30); // 10-40 minutes
    
    await query(
      `UPDATE rides SET 
        status = 'completed', 
        completed_at = NOW(), 
        updated_at = NOW(),
        distance_km = $2,
        duration_minutes = $3,
        final_fare = estimated_fare 
       WHERE id = $1`,
      [rideId, distance, duration]
    );

    // Update driver stats
    await query(
      `UPDATE drivers SET status = 'online', total_rides = total_rides + 1,
       total_earnings = total_earnings + $1, updated_at = NOW()
       WHERE id = $2`,
      [ride.estimated_fare, driverDbId]
    );

    // Update rider stats
    await query(
      "UPDATE users SET total_rides = total_rides + 1, updated_at = NOW() WHERE id = $1",
      [ride.rider_id]
    );

    // Create payment record
    await query(
      `INSERT INTO payments(ride_id, user_id, amount, driver_amount, status, currency)
       VALUES($1, $2, $3, $4, 'succeeded', 'usd')`,
      [rideId, ride.rider_id, ride.estimated_fare, ride.estimated_fare * 0.85]
    );

    // Send completion notification
    await notificationService.createNotification(
      ride.rider_id,
      "ride_completed",
      `Your ride is complete! Fare: $${ride.estimated_fare}`
    );

    // Send detailed receipt email
    try {
      const receiptData = await query<{
        ride_id: string;
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
      }>(
        `SELECT 
          r.id AS ride_id,
          rider.first_name || ' ' || rider.last_name AS rider_name,
          rider.email AS rider_email,
          driver_user.first_name || ' ' || driver_user.last_name AS driver_name,
          r.pickup_address,
          r.dropoff_address,
          r.ride_type,
          r.distance_km,
          r.duration_minutes,
          r.final_fare,
          r.discount_amount,
          r.promo_code,
          r.payment_method,
          r.completed_at
         FROM rides r
         JOIN users rider ON rider.id = r.rider_id
         LEFT JOIN drivers d ON d.id = r.driver_id
         LEFT JOIN users driver_user ON driver_user.id = d.user_id
         WHERE r.id = $1`,
        [rideId]
      );

      if (receiptData.rows.length) {
        const data = receiptData.rows[0];
        
        // Calculate fare breakdown
        const baseFare = 2.50;
        const farePerKm = 1.20;
        const farePerMin = 0.30;
        
        const distanceFare = data.distance_km * farePerKm;
        const timeFare = data.duration_minutes * farePerMin;

        await emailService.sendReceipt(data.rider_email, {
          rideId: data.ride_id,
          riderName: data.rider_name,
          driverName: data.driver_name || 'Demo Driver',
          pickupAddress: data.pickup_address,
          dropoffAddress: data.dropoff_address,
          rideType: data.ride_type,
          distanceKm: data.distance_km,
          durationMinutes: data.duration_minutes,
          baseFare,
          distanceFare,
          timeFare,
          discountAmount: data.discount_amount || 0,
          promoCode: data.promo_code || undefined,
          finalFare: data.final_fare,
          paymentMethod: data.payment_method,
          completedAt: data.completed_at
        });
      }
    } catch (emailError) {
      console.error('Failed to send receipt email:', emailError);
    }

    console.log(`Ride ${rideId}: in_progress → completed`);
  } catch (error) {
    console.error("Error in autoProgressRide:", error);
  }
}
