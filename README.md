# RideSwift 🚗

A full-stack, production-ready cab-booking application (Uber clone) built with **Next.js 14**, **Express.js**, **PostgreSQL**, **Clerk**, **Stripe**, and **Socket.IO**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## Features

| Feature | Description |
|---|---|
| Authentication | Sign-up / sign-in with Clerk (email, Google, GitHub) |
| Role-based access | Rider and Driver portals with separate routing |
| Ride booking | 3-step wizard – pickup/drop, ride type, payment |
| Multi-stop rides | Add up to 3 intermediate stops |
| Real-time tracking | Live driver location via Socket.IO |
| Fare estimation | Google Distance Matrix API + haversine fallback + surge pricing |
| Payments | Stripe payment intents, saved cards, in-app wallet |
| Ride history | Full history with downloadable receipts |
| Driver dashboard | Accept / decline requests, live ride management |
| Driver earnings | Daily / weekly breakdown with payout history |
| Ratings & reviews | 5-star ratings + quick-tag feedback |
| Promo codes | Percentage or fixed-amount discount codes |
| Emergency SOS | One-tap SOS with location broadcast |
| Customer support | FAQ + support ticket form |

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router, RSC)
- **React 18** + **TypeScript 5**
- **Tailwind CSS 3.4**
- **Clerk** – authentication & user management
- **Stripe.js** – payment UI
- **Socket.IO client** – real-time events
- **Zustand** – client state
- **Axios** – HTTP client
- **Lucide React** – icons
- **react-hot-toast** – notifications

### Backend
- **Express.js 4** + **TypeScript**
- **PostgreSQL** – primary database (`pg` driver)
- **Clerk Backend** – JWT verification
- **Stripe Node.js** – payments & webhooks
- **Socket.IO 4** – real-time WebSocket server
- **Nodemailer** – transactional email
- **Winston** – structured logging
- **Helmet / CORS / rate-limit** – security

---

## Architecture

```
d:\cab-booking\
├── frontend/          # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/    # Sign-in / sign-up (Clerk)
│   │   ├── (rider)/   # Rider portal
│   │   ├── (driver)/  # Driver portal
│   │   ├── api/       # Next.js API routes (Stripe webhook)
│   │   └── page.tsx   # Landing page
│   ├── components/    # Shared React components
│   ├── hooks/         # useSocket, useGeolocation
│   ├── lib/           # API client, utilities
│   └── types/         # TypeScript interfaces
│
├── backend/           # Express.js REST + Socket.IO
│   └── src/
│       ├── config/    # Database pool, Stripe client
│       ├── controllers/
│       ├── middleware/ # Auth (Clerk), error handler, rate limiter
│       ├── routes/
│       ├── services/  # Business logic
│       ├── utils/     # Logger
│       ├── socket.ts  # Socket.IO server init
│       └── app.ts / index.ts
│
└── database/
    └── schema.sql     # PostgreSQL table definitions + seed data
```

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| PostgreSQL | 14.x |
| A [Clerk](https://clerk.com) account | – |
| A [Stripe](https://stripe.com) account | – |
| (Optional) Google Maps API key | – |

---

## Getting Started

### 1 – Clone & install

```bash
git clone https://github.com/your-org/rideswift.git
cd rideswift
npm install          # installs workspaces: frontend + backend
```

### 2 – Set up environment variables

```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```

Fill in all values (see [Environment Variables](#environment-variables) below).

### 3 – Set up the database

```bash
# Create the database
createdb rideswift

# Apply the schema
psql -d rideswift -f database/schema.sql
```

### 4 – Run in development

```bash
npm run dev          # starts both frontend (:3000) and backend (:5000) concurrently
```

Or start individually:

```bash
npm run dev:frontend   # Next.js on http://localhost:3000
npm run dev:backend    # Express on http://localhost:5000
```

### 5 – Stripe webhooks (local)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the printed webhook secret into `backend/.env` as `STRIPE_WEBHOOK_SECRET`.

---

## Environment Variables

### `frontend/.env.local`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

### `backend/.env`

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/rideswift

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app-password
EMAIL_FROM=RideSwift <noreply@rideswift.com>

FRONTEND_URL=http://localhost:3000
```

---

## Database Setup

The schema lives in [`database/schema.sql`](database/schema.sql) and creates:

| Table | Description |
|---|---|
| `users` | All registered users (riders + drivers) |
| `drivers` | Driver-specific data (status, location, earnings) |
| `vehicles` | Vehicle details per driver |
| `driver_documents` | Verification documents |
| `rides` | All ride records with full lifecycle |
| `ride_stops` | Multi-stop waypoints |
| `payments` | Payment records linked to Stripe |
| `payment_methods` | Saved cards (Stripe Payment Method IDs) |
| `reviews` | Bidirectional ratings |
| `notifications` | In-app notification feed |
| `emergency_contacts` | SOS contact list per user |
| `promo_codes` | Discount code catalog |
| `sos_alerts` | Emergency alert log |

---

## API Reference

All endpoints are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Health check |
| POST | `/auth/webhook/clerk` | Clerk | Sync Clerk user to DB |
| POST | `/rides/estimate` | rider | Fare estimate |
| POST | `/rides` | rider | Book a ride |
| GET | `/rides/active` | rider | Active ride |
| GET | `/rides/history` | rider | Paginated history |
| PATCH | `/rides/:id/cancel` | rider | Cancel ride |
| PATCH | `/rides/:id/accept` | driver | Accept ride request |
| PATCH | `/rides/:id/complete` | driver | Complete ride |
| GET | `/drivers/nearby` | rider | Nearby available drivers |
| PATCH | `/drivers/status` | driver | Toggle online/offline |
| PATCH | `/drivers/location` | driver | Update GPS coordinates |
| GET | `/drivers/earnings` | driver | Earnings breakdown |
| POST | `/payments/create-intent` | rider | Create Stripe PaymentIntent |
| POST | `/payments/webhook` | Stripe | Stripe event handler |
| GET | `/payments/cards` | rider | Saved cards |
| GET | `/payments/transactions` | rider | Transaction history |
| POST | `/payments/wallet/topup` | rider | Top up wallet |
| POST | `/reviews` | any | Submit rating |
| POST | `/promos/validate` | rider | Validate promo code |
| POST | `/sos/trigger` | any | Trigger SOS |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
```

Set all `NEXT_PUBLIC_*` and server-side env vars in the Vercel dashboard.

### Backend → Railway / Render / Fly.io

```bash
cd backend
npm run build        # tsc → dist/
node dist/index.js
```

Set all env vars in your hosting provider. Make sure `DATABASE_URL` points to your production PostgreSQL instance.

### Database → Supabase / Neon / Railway Postgres

```bash
psql $DATABASE_URL -f database/schema.sql
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend in parallel |
| `npm run dev:frontend` | Next.js dev server only |
| `npm run dev:backend` | Express dev server only (ts-node-dev) |
| `npm run build` | Build both workspaces |
| `npm run lint` | ESLint across workspaces |

---

## License

MIT © RideSwift
