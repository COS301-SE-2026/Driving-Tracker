-- ===
-- Database schema
-- Driving tracker
--initial version

CREATE EXTENSION IF NOT EXIST "pgcrypto";-- enables uuid

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50),
    name            VARCHAR(100) NOT NULL,
    surname         VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    consent_status  BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicle (
    vehicle_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    registration    VARCHAR(20),
    make            VARCHAR(50),
    model           VARCHAR(50),
    year            INTEGER,
    fuel_type       VARCHAR(20)
)

CREATE TABLE trips(
    trip_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE,
    vehicle_id      UUID REFERENCES vehicle(vehicle_id),
    start_time      TIMESTAMP DEFAULT NOW(),
    start_date      DATETIME DEFAULT NOW(),
    end_time        TIMESTAMP,
    end_date        DATETIME,
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
    created_at       TIMESTAMP DEFAULT NOW()  
);

CREATE TABLE trip_scores(
    score_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id       UUID NOT NULL REFERENCES trips(trip_id),
    safety_score  DECIMAL(5,2),
    eco_score     DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trip_events(
    event_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id       UUID NOT NULL REFERENCES trips(trip_id),
    type          VARCHAR(30) CHECK (type IN ('HARSH_BRAKE', 'HARSH_ACCELERATION', 'SHARP_CORNER', 'CRASH_LIKE')),
    latitude      DECIMAL(9,6),
    longitude     DECIMAL(9,6),
    severity      DECIMAL(5,2),
    sensor_source VARCHAR(20) CHECK (sensor_source IN ('ACCELEROMETER', 'GYROSCOPE', 'OBD')),
    timestamp     TIMESTAMP NOT NULL
);

CREATE TABLE trip_readings(
    reading_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id            UUID NOT NULL REFERENCES trips(trip_id),
    timestamp          TIMESTAMP NOT NULL,
    data_source        VARCHAR(25) CHECK (data_source IN ('OBD','PHONE_SENSORS')),
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