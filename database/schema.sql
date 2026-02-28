-- ============================================================
--  RideSwift – PostgreSQL Schema
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ──────────────────────────────────────────────────────────────
--  USERS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                BIGSERIAL     PRIMARY KEY,
  clerk_id          TEXT          NOT NULL UNIQUE,
  email             TEXT          NOT NULL UNIQUE,
  first_name        TEXT          NOT NULL DEFAULT '',
  last_name         TEXT          NOT NULL DEFAULT '',
  phone             TEXT,
  bio               TEXT,
  profile_picture   TEXT,
  role              TEXT          NOT NULL DEFAULT 'rider' CHECK (role IN ('rider', 'driver', 'admin')),
  rating            NUMERIC(3,2)  NOT NULL DEFAULT 5.00,
  wallet_balance    NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_rides       INTEGER       NOT NULL DEFAULT 0,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users (clerk_id);
CREATE INDEX idx_users_email    ON users (email);

-- ──────────────────────────────────────────────────────────────
--  DRIVERS  (extends users where role = 'driver')
-- ──────────────────────────────────────────────────────────────
CREATE TABLE drivers (
  id              BIGSERIAL     PRIMARY KEY,
  user_id         BIGINT        NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  status          TEXT          NOT NULL DEFAULT 'offline' CHECK (status IN ('offline','available','busy')),
  current_lat     NUMERIC(10,7),
  current_lng     NUMERIC(10,7),
  rating          NUMERIC(3,2)  NOT NULL DEFAULT 5.00,
  total_rides     INTEGER       NOT NULL DEFAULT 0,
  total_earnings  NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  is_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
  vehicle_type    TEXT          CHECK (vehicle_type IN ('economy','premium','suv','auto')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drivers_status            ON drivers (status);
CREATE INDEX idx_drivers_user_id           ON drivers (user_id);
CREATE INDEX idx_drivers_lat_lng           ON drivers (current_lat, current_lng);

-- ──────────────────────────────────────────────────────────────
--  VEHICLES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE vehicles (
  id              BIGSERIAL   PRIMARY KEY,
  driver_id       BIGINT      NOT NULL UNIQUE REFERENCES drivers (id) ON DELETE CASCADE,
  make            TEXT        NOT NULL,
  model           TEXT        NOT NULL,
  year            SMALLINT    NOT NULL,
  color           TEXT        NOT NULL,
  license_plate   TEXT        NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN ('economy','premium','suv','auto')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────────
--  DRIVER DOCUMENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE driver_documents (
  id              BIGSERIAL   PRIMARY KEY,
  driver_id       BIGINT      NOT NULL REFERENCES drivers (id) ON DELETE CASCADE,
  document_type   TEXT        NOT NULL CHECK (document_type IN ('license','insurance','registration','background_check')),
  document_url    TEXT        NOT NULL,
  verified        BOOLEAN     NOT NULL DEFAULT FALSE,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (driver_id, document_type)
);

-- ──────────────────────────────────────────────────────────────
--  RIDES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE rides (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id            BIGINT        NOT NULL REFERENCES users (id),
  driver_id           BIGINT        REFERENCES drivers (id),

  -- Pickup
  pickup_address      TEXT          NOT NULL,
  pickup_lat          NUMERIC(10,7) NOT NULL,
  pickup_lng          NUMERIC(10,7) NOT NULL,

  -- Dropoff
  dropoff_address     TEXT          NOT NULL,
  dropoff_lat         NUMERIC(10,7) NOT NULL,
  dropoff_lng         NUMERIC(10,7) NOT NULL,

  -- Ride details
  ride_type           TEXT          NOT NULL DEFAULT 'economy' CHECK (ride_type IN ('economy','premium','suv','auto')),
  status              TEXT          NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','searching','accepted','in_progress','completed','cancelled')),

  -- Fares & payments
  estimated_fare      NUMERIC(10,2) NOT NULL,
  final_fare          NUMERIC(10,2),
  payment_method      TEXT          NOT NULL DEFAULT 'card' CHECK (payment_method IN ('card','wallet','cash')),
  payment_status      TEXT          NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),

  -- Promo
  promo_code          TEXT,
  discount_amount     NUMERIC(10,2) NOT NULL DEFAULT 0.00,

  -- Distance & duration (filled on completion)
  distance_km         NUMERIC(8,2),
  duration_minutes    INTEGER,

  -- Cancellation
  cancellation_reason TEXT,
  cancelled_by        TEXT          CHECK (cancelled_by IN ('rider','driver','system')),

  -- Timestamps
  accepted_at         TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rides_rider_id   ON rides (rider_id);
CREATE INDEX idx_rides_driver_id  ON rides (driver_id);
CREATE INDEX idx_rides_status     ON rides (status);
CREATE INDEX idx_rides_created_at ON rides (created_at DESC);

-- ──────────────────────────────────────────────────────────────
--  RIDE STOPS  (multi-stop support)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE ride_stops (
  id          BIGSERIAL     PRIMARY KEY,
  ride_id     UUID          NOT NULL REFERENCES rides (id) ON DELETE CASCADE,
  address     TEXT          NOT NULL,
  lat         NUMERIC(10,7) NOT NULL,
  lng         NUMERIC(10,7) NOT NULL,
  stop_order  SMALLINT      NOT NULL,
  reached_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (ride_id, stop_order)
);

-- ──────────────────────────────────────────────────────────────
--  PAYMENTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id                        BIGSERIAL     PRIMARY KEY,
  ride_id                   UUID          NOT NULL REFERENCES rides (id),
  user_id                   BIGINT        NOT NULL REFERENCES users (id),
  amount                    NUMERIC(10,2) NOT NULL,
  driver_amount             NUMERIC(10,2) NOT NULL,  -- 85% of amount
  currency                  TEXT          NOT NULL DEFAULT 'usd',
  status                    TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed','refunded')),
  stripe_payment_intent_id  TEXT          UNIQUE,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id  ON payments (user_id);
CREATE INDEX idx_payments_ride_id  ON payments (ride_id);
CREATE INDEX idx_payments_status   ON payments (status);

-- ──────────────────────────────────────────────────────────────
--  PAYMENT METHODS  (saved cards via Stripe)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE payment_methods (
  id              BIGSERIAL   PRIMARY KEY,
  user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stripe_pm_id    TEXT        NOT NULL UNIQUE,
  last4           CHAR(4)     NOT NULL,
  brand           TEXT        NOT NULL,
  expiry_month    SMALLINT    NOT NULL,
  expiry_year     SMALLINT    NOT NULL,
  is_default      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user_id ON payment_methods (user_id);

-- Only one default card per user
CREATE UNIQUE INDEX idx_payment_methods_default
  ON payment_methods (user_id)
  WHERE is_default = TRUE;

-- ──────────────────────────────────────────────────────────────
--  REVIEWS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id            BIGSERIAL     PRIMARY KEY,
  ride_id       UUID          NOT NULL REFERENCES rides (id),
  reviewer_id   BIGINT        NOT NULL REFERENCES users (id),
  reviewee_id   BIGINT        NOT NULL REFERENCES users (id),
  rating        SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  tags          TEXT[],
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (ride_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee_id ON reviews (reviewee_id);
CREATE INDEX idx_reviews_ride_id     ON reviews (ride_id);

-- ──────────────────────────────────────────────────────────────
--  NOTIFICATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type        TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  data        JSONB,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX idx_notifications_read       ON notifications (user_id, read);
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- ──────────────────────────────────────────────────────────────
--  EMERGENCY CONTACTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE emergency_contacts (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts (user_id);

-- ──────────────────────────────────────────────────────────────
--  PROMO CODES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE promo_codes (
  id              BIGSERIAL     PRIMARY KEY,
  code            TEXT          NOT NULL UNIQUE,
  discount_type   TEXT          NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value  NUMERIC(8,2)  NOT NULL,
  min_fare        NUMERIC(8,2)  NOT NULL DEFAULT 0.00,
  max_discount    NUMERIC(8,2),
  expires_at      TIMESTAMPTZ,
  usage_limit     INTEGER,
  usage_count     INTEGER       NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_codes_code      ON promo_codes (code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes (is_active);

-- ──────────────────────────────────────────────────────────────
--  SOS ALERTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE sos_alerts (
  id          BIGSERIAL     PRIMARY KEY,
  user_id     BIGINT        NOT NULL REFERENCES users (id),
  ride_id     UUID          REFERENCES rides (id),
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  resolved    BOOLEAN       NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sos_alerts_user_id    ON sos_alerts (user_id);
CREATE INDEX idx_sos_alerts_created_at ON sos_alerts (created_at DESC);

-- ──────────────────────────────────────────────────────────────
--  SEED DATA
-- ──────────────────────────────────────────────────────────────
INSERT INTO promo_codes (code, discount_type, discount_value, min_fare, max_discount, usage_limit, is_active)
VALUES
  ('RIDE10',   'percentage', 10.00, 5.00,  20.00, 1000, TRUE),
  ('WELCOME',  'percentage', 20.00, 0.00,  30.00,  500, TRUE),
  ('FLAT5OFF', 'fixed',       5.00, 10.00, NULL,   NULL, TRUE);

-- ──────────────────────────────────────────────────────────────
--  updated_at trigger  (auto-update timestamp on row change)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rides_updated_at
  BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
