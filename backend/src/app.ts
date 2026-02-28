import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { globalRateLimiter } from "./middleware/rateLimiter.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

// Route imports
import authRoutes         from "./routes/auth.routes";
import userRoutes         from "./routes/user.routes";
import rideRoutes         from "./routes/ride.routes";
import driverRoutes       from "./routes/driver.routes";
import paymentRoutes      from "./routes/payment.routes";
import reviewRoutes       from "./routes/review.routes";
import promoRoutes        from "./routes/promo.routes";
import sosRoutes          from "./routes/sos.routes";
import favoritesRoutes    from "./routes/favorites.routes";
import preferencesRoutes  from "./routes/preferences.routes";
import memoriesRoutes     from "./routes/memories.routes";
import achievementsRoutes from "./routes/achievements.routes";
import carbonRoutes       from "./routes/carbon.routes";

const app: Application = express();

// ─── Security & Utility Middleware ────────────────────────────────────────────
app.use(helmet());

// allow requests from one or more frontend origins (comma-separated env var)
const rawOrigins = process.env.FRONTEND_URL || "http://localhost:3000";
let allowedOrigins = rawOrigins.split(",").map(o => o.trim()).filter(Boolean);
console.log("CORS allowed origins:", allowedOrigins);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) console.log("Incoming request origin:", origin);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // if no origin (e.g. server-to-server) allow it
      if (!origin) return callback(null, true);
      // support wildcard
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`Blocked CORS request from ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Raw body for Stripe webhooks (must come before json middleware for /webhooks)
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use("/api", globalRateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",         authRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/rides",        rideRoutes);
app.use("/api/drivers",      driverRoutes);
app.use("/api/payments",     paymentRoutes);
app.use("/api/reviews",      reviewRoutes);
app.use("/api/promos",       promoRoutes);
app.use("/api/sos",          sosRoutes);
app.use("/api/favorites",    favoritesRoutes);
app.use("/api/preferences",  preferencesRoutes);
app.use("/api/memories",     memoriesRoutes);
app.use("/api/achievements", achievementsRoutes);
app.use("/api/carbon",       carbonRoutes);

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
