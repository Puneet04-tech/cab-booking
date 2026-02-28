import rateLimit from "express-rate-limit";

export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10), // 15 min default
  max: parseInt(process.env.RATE_LIMIT_MAX ?? "500", 10), // Increased for polling endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests from this IP. Please try again later.",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many authentication attempts. Please try again in 15 minutes.",
  },
});

export const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "You are booking too fast. Please wait before trying again.",
  },
});

export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: "Too many payment requests. Please wait before trying again.",
  },
});
