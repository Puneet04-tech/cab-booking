import nodemailer from "nodemailer";
import logger from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface ReceiptData {
  rideId: string;
  riderName: string;
  driverName: string;
  pickupAddress: string;
  dropoffAddress: string;
  rideType: string;
  distanceKm: number;
  durationMinutes: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  discountAmount: number;
  promoCode?: string;
  finalFare: number;
  paymentMethod: string;
  completedAt: Date;
}

export async function sendReceipt(
  to: string,
  receiptData: ReceiptData
): Promise<void> {
  if (!process.env.SMTP_USER) {
    logger.warn("SMTP not configured – skipping receipt email");
    return;
  }

  const {
    rideId,
    riderName,
    driverName,
    pickupAddress,
    dropoffAddress,
    rideType,
    distanceKm,
    durationMinutes,
    baseFare,
    distanceFare,
    timeFare,
    discountAmount,
    promoCode,
    finalFare,
    paymentMethod,
    completedAt
  } = receiptData;

  const subtotal = baseFare + distanceFare + timeFare;
  const receiptNumber = `RS-${rideId.slice(0, 8).toUpperCase()}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>RideSwift Receipt</title></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;padding:24px;margin:0;">
      <div style="max-width:600px;margin:0 auto;background:linear-gradient(180deg,#1a1a2e 0%,#16162d 100%);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(123,63,242,0.3);border:1px solid rgba(123,63,242,0.2);">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#7b3ff2,#00ff9f);padding:40px 32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:32px;font-weight:700;text-shadow:0 2px 12px rgba(0,0,0,0.3);">🚗 RideSwift</h1>
          <p style="color:rgba(255,255,255,0.95);margin:8px 0 0;font-size:16px;font-weight:500;">Ride Receipt</p>
        </div>

        <!-- Receipt Number -->
        <div style="padding:24px 32px;border-bottom:1px solid rgba(123,63,242,0.2);">
          <div style="text-align:center;">
            <p style="color:#8b5cf6;font-size:14px;margin:0;text-transform:uppercase;letter-spacing:2px;">Receipt Number</p>
            <p style="color:#00ff9f;font-size:24px;font-weight:700;margin:8px 0 0;text-shadow:0 0 20px rgba(0,255,159,0.5);">${receiptNumber}</p>
          </div>
        </div>

        <!-- Ride Details -->
        <div style="padding:32px;">
          <h2 style="color:#00ff9f;margin:0 0 20px;font-size:18px;text-shadow:0 0 10px rgba(0,255,159,0.5);">Trip Summary</h2>
          
          <!-- Route -->
          <div style="background:rgba(123,63,242,0.1);border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid rgba(123,63,242,0.2);">
            <div style="margin-bottom:16px;">
              <div style="color:#8b5cf6;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">🔵 Pickup</div>
              <div style="color:#e9d5ff;font-size:15px;line-height:1.5;">${pickupAddress}</div>
            </div>
            <div>
              <div style="color:#8b5cf6;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">🟢 Dropoff</div>
              <div style="color:#e9d5ff;font-size:15px;line-height:1.5;">${dropoffAddress}</div>
            </div>
          </div>

          <!-- Trip Details Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
            <div style="background:rgba(123,63,242,0.1);border-radius:12px;padding:16px;border:1px solid rgba(123,63,242,0.2);">
              <div style="color:#8b5cf6;font-size:12px;margin-bottom:4px;">Driver</div>
              <div style="color:#e9d5ff;font-weight:600;font-size:15px;">${driverName}</div>
            </div>
            <div style="background:rgba(123,63,242,0.1);border-radius:12px;padding:16px;border:1px solid rgba(123,63,242,0.2);">
              <div style="color:#8b5cf6;font-size:12px;margin-bottom:4px;">Vehicle Type</div>
              <div style="color:#e9d5ff;font-weight:600;font-size:15px;text-transform:capitalize;">${rideType}</div>
            </div>
            <div style="background:rgba(123,63,242,0.1);border-radius:12px;padding:16px;border:1px solid rgba(123,63,242,0.2);">
              <div style="color:#8b5cf6;font-size:12px;margin-bottom:4px;">Distance</div>
              <div style="color:#e9d5ff;font-weight:600;font-size:15px;">${distanceKm.toFixed(2)} km</div>
            </div>
            <div style="background:rgba(123,63,242,0.1);border-radius:12px;padding:16px;border:1px solid rgba(123,63,242,0.2);">
              <div style="color:#8b5cf6;font-size:12px;margin-bottom:4px;">Duration</div>
              <div style="color:#e9d5ff;font-weight:600;font-size:15px;">${durationMinutes} min</div>
            </div>
          </div>

          <!-- Fare Breakdown -->
          <h2 style="color:#00ff9f;margin:0 0 16px;font-size:18px;text-shadow:0 0 10px rgba(0,255,159,0.5);">Fare Breakdown</h2>
          <div style="background:rgba(123,63,242,0.1);border-radius:12px;padding:20px;border:1px solid rgba(123,63,242,0.2);">
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="color:#c4b5fd;">Base Fare</span>
              <span style="color:#e9d5ff;font-weight:600;">$${baseFare.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="color:#c4b5fd;">Distance (${distanceKm.toFixed(2)} km)</span>
              <span style="color:#e9d5ff;font-weight:600;">$${distanceFare.toFixed(2)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
              <span style="color:#c4b5fd;">Time (${durationMinutes} min)</span>
              <span style="color:#e9d5ff;font-weight:600;">$${timeFare.toFixed(2)}</span>
            </div>
            ${discountAmount > 0 ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-top:12px;border-top:1px solid rgba(123,63,242,0.2);">
              <span style="color:#00ff9f;">Discount ${promoCode ? `(${promoCode})` : ''}</span>
              <span style="color:#00ff9f;font-weight:600;">-$${discountAmount.toFixed(2)}</span>
            </div>` : ''}
            <div style="display:flex;justify-content:space-between;padding-top:16px;border-top:2px solid rgba(123,63,242,0.3);margin-top:16px;">
              <span style="color:#00ff9f;font-weight:700;font-size:20px;text-shadow:0 0 15px rgba(0,255,159,0.5);">Total Paid</span>
              <span style="color:#00ff9f;font-weight:700;font-size:20px;text-shadow:0 0 15px rgba(0,255,159,0.5);">$${finalFare.toFixed(2)}</span>
            </div>
          </div>

          <!-- Payment Info -->
          <div style="margin-top:24px;padding:16px;background:rgba(0,255,159,0.05);border-radius:12px;border:1px solid rgba(0,255,159,0.2);">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="color:#8b5cf6;font-size:14px;">Payment Method</span>
              <span style="color:#e9d5ff;font-weight:600;text-transform:capitalize;">${paymentMethod}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:#8b5cf6;font-size:14px;">Date & Time</span>
              <span style="color:#e9d5ff;font-weight:600;">${new Date(completedAt).toLocaleString("en-US", { 
                month: "short", 
                day: "numeric", 
                year: "numeric", 
                hour: "2-digit", 
                minute: "2-digit" 
              })}</span>
            </div>
          </div>

          <!-- Thank You Message -->
          <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid rgba(123,63,242,0.2);">
            <p style="color:#c4b5fd;font-size:16px;margin:0 0 12px;font-weight:500;">Thank you for riding with RideSwift!</p>
            <p style="color:#8b5cf6;font-size:14px;margin:0;">We hope to serve you again soon.</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:rgba(0,0,0,0.3);padding:20px;text-align:center;border-top:1px solid rgba(123,63,242,0.2);">
          <p style="color:#6b7280;font-size:12px;margin:0;">© ${new Date().getFullYear()} RideSwift. All rights reserved.</p>
          <p style="color:#6b7280;font-size:11px;margin:8px 0 0;">Questions? Contact us at support@rideswift.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "RideSwift <noreply@rideswift.com>",
      to,
      subject: `Your RideSwift Receipt – $${finalFare.toFixed(2)} | ${receiptNumber}`,
      html,
    });
    logger.info(`Detailed receipt sent to ${to} for ride ${rideId}`);
  } catch (err) {
    logger.error("Failed to send receipt email:", err);
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  if (!process.env.SMTP_USER) return;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;text-align:center;padding:32px;">
      <h1 style="color:#f97316;">Welcome to RideSwift, ${name}! 🚗</h1>
      <p style="color:#6b7280;">Your account is ready. Book your first ride and experience fast, safe, affordable travel.</p>
      <a href="${process.env.FRONTEND_URL}/booking" 
         style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:12px;font-weight:600;text-decoration:none;margin-top:16px;">
        Book Your First Ride
      </a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "RideSwift <noreply@rideswift.com>",
      to,
      subject: "Welcome to RideSwift! 🚗",
      html,
    });
  } catch (err) {
    logger.error("Failed to send welcome email:", err);
  }
}

export async function sendRideNotificationEmail(
  to: string,
  driverName: string,
  rideDetails: {
    rideId: string;
    pickupAddress: string;
    dropoffAddress: string;
    estimatedFare: number;
    rideType: string;
  }
): Promise<void> {
  if (!process.env.SMTP_USER) {
    logger.warn("SMTP not configured – skipping ride notification email");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>New Ride Request</title></head>
    <body style="font-family:Inter,sans-serif;background:#f9fafb;padding:24px;">
      <div style="max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#7b3ff2,#00ff9f);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;">🚗 RideSwift</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">New Ride Request</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#111827;margin:0 0 8px;">Hi ${driverName}!</h2>
          <p style="color:#6b7280;margin:0 0 24px;">A new ride request is waiting for you.</p>
          
          <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:20px;">
            <div style="margin-bottom:16px;">
              <div style="color:#6b7280;font-size:12px;margin-bottom:4px;">📍 PICKUP</div>
              <div style="color:#111827;font-weight:600;">${rideDetails.pickupAddress}</div>
            </div>
            <div style="margin-bottom:16px;">
              <div style="color:#6b7280;font-size:12px;margin-bottom:4px;">🎯 DROP-OFF</div>
              <div style="color:#111827;font-weight:600;">${rideDetails.dropoffAddress}</div>
            </div>
            <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;display:flex;justify-content:space-between;">
              <div>
                <div style="color:#6b7280;font-size:12px;">Ride Type</div>
                <div style="color:#111827;font-weight:600;text-transform:capitalize;">${rideDetails.rideType}</div>
              </div>
              <div style="text-align:right;">
                <div style="color:#6b7280;font-size:12px;">Estimated Fare</div>
                <div style="color:#00ff9f;font-weight:700;font-size:18px;">$${rideDetails.estimatedFare.toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div style="background:#e0f2fe;border-left:4px solid #0ea5e9;padding:12px;border-radius:8px;margin-bottom:20px;">
            <p style="color:#0c4a6e;margin:0;font-size:14px;">
              <strong>💰 Your Earnings:</strong> You'll earn 85% = $${(rideDetails.estimatedFare * 0.85).toFixed(2)}
            </p>
          </div>

          <a href="${process.env.FRONTEND_URL}/sign-in?redirect=/driver/dashboard" 
             style="display:block;background:linear-gradient(135deg,#7b3ff2,#00ff9f);color:white;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;text-align:center;box-shadow:0 4px 12px rgba(123,63,242,0.3);">
            Login & Accept Ride
          </a>
          
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">
            Ride ID: ${rideDetails.rideId.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} RideSwift. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "RideSwift <noreply@rideswift.com>",
      to,
      subject: `🚗 New Ride Request – $${rideDetails.estimatedFare.toFixed(2)} | RideSwift`,
      html,
    });
    logger.info(`Ride notification sent to ${to} for ride ${rideDetails.rideId}`);
  } catch (err) {
    logger.error("Failed to send ride notification email:", err);
  }
}
