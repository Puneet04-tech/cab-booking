-- ============================================================
--  RideSwift – New Innovative Features Migration
-- ============================================================

-- ──────────────────────────────────────────────────────────────
--  CARBON FOOTPRINT TRACKING
-- ──────────────────────────────────────────────────────────────
CREATE TABLE carbon_footprint (
  id                    BIGSERIAL     PRIMARY KEY,
  user_id               BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  ride_id               UUID          NOT NULL REFERENCES rides (id) ON DELETE CASCADE,
  co2_saved_kg          NUMERIC(8,3)  NOT NULL,  -- CO2 saved vs driving own car
  trees_equivalent      NUMERIC(6,2)  NOT NULL,  -- Number of trees needed to offset
  ride_type             TEXT          NOT NULL,
  distance_km           NUMERIC(8,2)  NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (ride_id)
);

CREATE INDEX idx_carbon_footprint_user_id ON carbon_footprint (user_id);

-- ──────────────────────────────────────────────────────────────
--  FAVORITE ROUTES (One-click rebooking)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE favorite_routes (
  id                  BIGSERIAL     PRIMARY KEY,
  user_id             BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  route_name          TEXT          NOT NULL,  -- "Home to Office", "Airport Run"
  pickup_address      TEXT          NOT NULL,
  pickup_lat          NUMERIC(10,7) NOT NULL,
  pickup_lng          NUMERIC(10,7) NOT NULL,
  dropoff_address     TEXT          NOT NULL,
  dropoff_lat         NUMERIC(10,7) NOT NULL,
  dropoff_lng         NUMERIC(10,7) NOT NULL,
  preferred_ride_type TEXT          DEFAULT 'economy' CHECK (preferred_ride_type IN ('economy','premium','suv','auto')),
  usage_count         INTEGER       NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_favorite_routes_user_id ON favorite_routes (user_id);

CREATE TRIGGER trg_favorite_routes_updated_at
  BEFORE UPDATE ON favorite_routes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────
--  RIDE PREFERENCES (Music, Temperature, Conversation)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE ride_preferences (
  id                    BIGSERIAL   PRIMARY KEY,
  user_id               BIGINT      NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  music_preference      TEXT        DEFAULT 'no_preference' CHECK (music_preference IN ('no_music','soft','upbeat','radio','no_preference')),
  temperature           TEXT        DEFAULT 'moderate' CHECK (temperature IN ('cool','moderate','warm')),
  conversation          TEXT        DEFAULT 'no_preference' CHECK (conversation IN ('quiet','friendly','no_preference')),
  pet_friendly          BOOLEAN     NOT NULL DEFAULT FALSE,
  accessibility_needs   TEXT[],     -- wheelchair, hearing_assist, etc.
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_ride_preferences_updated_at
  BEFORE UPDATE ON ride_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────
--  RIDE MEMORIES (Add notes/photos to completed rides)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE ride_memories (
  id          BIGSERIAL   PRIMARY KEY,
  ride_id     UUID        NOT NULL UNIQUE REFERENCES rides (id) ON DELETE CASCADE,
  user_id     BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title       TEXT,
  notes       TEXT,
  photos      TEXT[],     -- Array of photo URLs
  is_favorite BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_memories_user_id    ON ride_memories (user_id);
CREATE INDEX idx_ride_memories_favorite   ON ride_memories (user_id, is_favorite);

CREATE TRIGGER trg_ride_memories_updated_at
  BEFORE UPDATE ON ride_memories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────────────────────────
--  SPLIT PAYMENTS (Multiple payment methods in one ride)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE split_payments (
  id                  BIGSERIAL     PRIMARY KEY,
  ride_id             UUID          NOT NULL REFERENCES rides (id) ON DELETE CASCADE,
  payment_method      TEXT          NOT NULL CHECK (payment_method IN ('card','wallet','cash')),
  amount              NUMERIC(10,2) NOT NULL,
  stripe_payment_id   TEXT,
  status              TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','failed')),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_split_payments_ride_id ON split_payments (ride_id);

-- ──────────────────────────────────────────────────────────────
--  EMERGENCY ALERTS LOG (Track automatic emergency notifications)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE emergency_alerts (
  id                BIGSERIAL   PRIMARY KEY,
  ride_id           UUID        NOT NULL REFERENCES rides (id),
  user_id           BIGINT      NOT NULL REFERENCES users (id),
  alert_type        TEXT        NOT NULL CHECK (alert_type IN ('ride_start','route_deviation','long_stop','sos')),
  contacts_notified INTEGER     NOT NULL DEFAULT 0,
  notification_data JSONB,      -- Contains details of who was notified and how
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_alerts_ride_id ON emergency_alerts (ride_id);
CREATE INDEX idx_emergency_alerts_user_id ON emergency_alerts (user_id);

-- ──────────────────────────────────────────────────────────────
--  USER ACHIEVEMENTS (Gamification)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE achievements (
  id          BIGSERIAL   PRIMARY KEY,
  code        TEXT        NOT NULL UNIQUE,  -- eco_warrior, frequent_rider, night_owl
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL,
  icon        TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('environmental','usage','social','safety')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id              BIGSERIAL   PRIMARY KEY,
  user_id         BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_id  BIGINT      NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements (user_id);

-- ──────────────────────────────────────────────────────────────
--  SEED ACHIEVEMENTS
-- ──────────────────────────────────────────────────────────────
INSERT INTO achievements (code, name, description, icon, category) VALUES
  ('eco_warrior', 'Eco Warrior', 'Saved 50kg of CO2 emissions', '🌱', 'environmental'),
  ('tree_hugger', 'Tree Hugger', 'Saved 100kg of CO2 emissions', '🌳', 'environmental'),
  ('frequent_rider', 'Frequent Rider', 'Completed 50 rides', '🚗', 'usage'),
  ('night_owl', 'Night Owl', 'Completed 10 rides between midnight and 5am', '🦉', 'usage'),
  ('early_bird', 'Early Bird', 'Completed 10 rides between 5am and 7am', '🌅', 'usage'),
  ('route_master', 'Route Master', 'Saved 5 favorite routes', '🗺️', 'usage'),
  ('safety_first', 'Safety First', 'Added emergency contacts', '🛡️', 'safety'),
  ('five_star', 'Five Star Rider', 'Maintained 5.0 rating for 20+ rides', '⭐', 'social');

-- ──────────────────────────────────────────────────────────────
--  Add columns to rides table for new features
-- ──────────────────────────────────────────────────────────────
ALTER TABLE rides 
  ADD COLUMN IF NOT EXISTS emergency_alert_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS preferences_applied JSONB;

-- ──────────────────────────────────────────────────────────────
--  VIEWS FOR ANALYTICS
-- ──────────────────────────────────────────────────────────────

-- User's total carbon footprint savings
CREATE OR REPLACE VIEW user_carbon_stats AS
SELECT 
  user_id,
  COUNT(*) AS total_eco_rides,
  SUM(co2_saved_kg) AS total_co2_saved_kg,
  SUM(trees_equivalent) AS total_trees_equivalent,
  ROUND(AVG(co2_saved_kg), 2) AS avg_co2_per_ride
FROM carbon_footprint
GROUP BY user_id;

-- User's favorite routes summary
CREATE OR REPLACE VIEW user_route_usage AS
SELECT 
  user_id,
  COUNT(*) AS total_favorite_routes,
  SUM(usage_count) AS total_route_bookings,
  MAX(usage_count) AS most_used_route_count
FROM favorite_routes
GROUP BY user_id;

-- User achievement summary
CREATE OR REPLACE VIEW user_achievement_summary AS
SELECT 
  ua.user_id,
  COUNT(*) AS total_achievements,
  COUNT(*) FILTER (WHERE a.category = 'environmental') AS environmental_badges,
  COUNT(*) FILTER (WHERE a.category = 'usage') AS usage_badges,
  COUNT(*) FILTER (WHERE a.category = 'safety') AS safety_badges,
  COUNT(*) FILTER (WHERE a.category = 'social') AS social_badges
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
GROUP BY ua.user_id;

