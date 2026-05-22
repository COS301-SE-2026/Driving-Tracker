-- ===
-- Database schema
-- Driving tracker
--initial version

CREATE EXTENSION IF NOT EXISTS "pgcrypto";-- enables uuid

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    surname         VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    consent_status  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    status          VARCHAR(10) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELETED')),
    deleted_at      TIMESTAMPTZ        
);

CREATE TABLE vehicles (
    vehicle_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    registration    VARCHAR(20),
    make            VARCHAR(50),
    model           VARCHAR(50),
    year            INTEGER,
    fuel_type       VARCHAR(20)
);

CREATE TABLE trips(
    trip_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    vehicle_id      UUID REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
    start_time      TIMESTAMPTZ DEFAULT NOW(),
    end_time        TIMESTAMPTZ,
    start_longitude DECIMAL(9,6),
    start_latitude  DECIMAL(9,6),
    end_longitude   DECIMAL(9,6),
    end_latitude    DECIMAL(9,6),
    route_polyline   TEXT,
    distance_km      DECIMAL(9,6),
    duration_minutes INTEGER,
    fuel_estimate    DECIMAL(10,2),
    data_source      VARCHAR(20) CHECK (data_source IN ('OBD', 'PHONE_SENSORS')),
    status           VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABORTED')),
    created_at       TIMESTAMPTZ DEFAULT NOW()  
);

CREATE TABLE trip_scores(
    score_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id       UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    safety_score  DECIMAL(5,2),
    eco_score     DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trip_events(
    event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id       UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    type          VARCHAR(30) CHECK (type IN ('HARSH_BRAKE', 'HARSH_ACCELERATION', 'SHARP_CORNER', 'CRASH_LIKE')),
    latitude      DECIMAL(9,6),
    longitude     DECIMAL(9,6),
    severity      DECIMAL(5,2),
    sensor_source VARCHAR(20) CHECK (sensor_source IN ('ACCELEROMETER', 'GYROSCOPE', 'OBD')),
    recorded_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE trip_readings(
    reading_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id            UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    recorded_at        TIMESTAMPTZ NOT NULL,
    data_source        VARCHAR(25) CHECK (data_source IN ('OBD','PHONE_SENSORS')),
    longitude          DECIMAL(9,6),
    latitude           DECIMAL(9,6),
    speed_kmh          DECIMAL(6,2),
    accelerometer      DECIMAL(8,4),
    gyroscope_x        DECIMAL(8,4),
    gyroscope_y        DECIMAL(8,4),
    gyroscope_z        DECIMAL(8,4),
    rpm                INTEGER,
    coolant_temp_c     DECIMAL(5,2),
    fuel_trim_percent  DECIMAL(5,2),
    throttle_position  DECIMAL(5,2),
    dtc_codes          TEXT[]
);

CREATE TABLE trusted_contacts(
    contact_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(user_id) on update cascade ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    relationship        VARCHAR(50),
    email               VARCHAR(255),
    phone               VARCHAR(20),
    consent_status      VARCHAR(10) DEFAULT 'PENDING' CHECK (consent_status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_preferences(
  preference_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id          UUID NOT NULL REFERENCES trusted_contacts(contact_id) ON DELETE CASCADE,
  on_crash            BOOLEAN DEFAULT TRUE,
  on_trip_end         BOOLEAN DEFAULT FALSE,
  on_unexpected_stop  BOOLEAN DEFAULT TRUE
);

CREATE TABLE alerts(
    alert_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         UUID NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    alert_type      VARCHAR(20) CHECK (alert_type IN ('CRASH_LIKE', 'UNEXPECTED_STOP', 'TRIP_COMPLETE', 'MANUAL')),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    recorded_at     TIMESTAMPTZ NOT NULL
);

CREATE TABLE alert_notifications(
  notification_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id           UUID NOT NULL REFERENCES alerts(alert_id) ON DELETE CASCADE,
  contact_id         UUID NOT NULL REFERENCES trusted_contacts(contact_id) ON DELETE CASCADE,
  delivery_status    VARCHAR(10) DEFAULT 'SENT' CHECK (delivery_status IN ('SENT', 'FAILED')),
  sent_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE badges(
    badge_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    category        VARCHAR(20) CHECK (category IN ('MILESTONE', 'STREAK', 'SOCIAL', 'VARIETY')),
    icon_url        VARCHAR(255)
);

CREATE TABLE user_badges (
  user_badge_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
  badge_id          UUID NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
  earned_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- CREATE TABLE badge_progress (
--   progress_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id      UUID NOT NULL REFERENCES users(user_id),
--   badge_id     UUID NOT NULL REFERENCES badges(badge_id),
--   current      INTEGER DEFAULT 0,
--   target       INTEGER NOT NULL,
--   updated_at   TIMESTAMP DEFAULT NOW(),
--   UNIQUE (username, badge_id)
-- );
CREATE TABLE badge_criteria (
  criteria_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id     UUID NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
  metric       VARCHAR(50),   
  operator     VARCHAR(10),   
  threshold    DECIMAL(10,2),
  target       INTEGER      
);

CREATE TABLE leaderboard (
  leaderboard_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
  category        VARCHAR(20) CHECK (category IN ('SAFETY', 'ECO', 'OVERALL')),
  scope           VARCHAR(20) CHECK (scope IN ('WEEKLY', 'MONTHLY', 'ALL_TIME')),
  score           DECIMAL(10,2) DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category, scope)
);