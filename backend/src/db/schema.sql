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
    vehicle_id      VARCHAR(50),
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