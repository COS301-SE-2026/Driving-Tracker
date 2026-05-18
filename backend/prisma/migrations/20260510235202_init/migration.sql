-- CreateTable
CREATE TABLE "alert_notifications" (
    "notification_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "delivery_status" VARCHAR(10) DEFAULT 'SENT',
    "sent_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "alert_preferences" (
    "preference_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "contact_id" UUID NOT NULL,
    "on_crash" BOOLEAN DEFAULT true,
    "on_trip_end" BOOLEAN DEFAULT false,
    "on_unexpected_stop" BOOLEAN DEFAULT true,

    CONSTRAINT "alert_preferences_pkey" PRIMARY KEY ("preference_id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "alert_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "alert_type" VARCHAR(20),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("alert_id")
);

-- CreateTable
CREATE TABLE "badge_criteria" (
    "criteria_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "badge_id" UUID NOT NULL,
    "metric" VARCHAR(50),
    "operator" VARCHAR(10),
    "threshold" DECIMAL(10,2),
    "target" INTEGER,

    CONSTRAINT "badge_criteria_pkey" PRIMARY KEY ("criteria_id")
);

-- CreateTable
CREATE TABLE "badges" (
    "badge_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(20),
    "icon_url" VARCHAR(255),

    CONSTRAINT "badges_pkey" PRIMARY KEY ("badge_id")
);

-- CreateTable
CREATE TABLE "leaderboard" (
    "leaderboard_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category" VARCHAR(20),
    "scope" VARCHAR(20),
    "score" DECIMAL(10,2) DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("leaderboard_id")
);

-- CreateTable
CREATE TABLE "trip_events" (
    "event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "type" VARCHAR(30),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "severity" DECIMAL(5,2),
    "sensor_source" VARCHAR(20),
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trip_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "trip_readings" (
    "reading_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL,
    "data_source" VARCHAR(25),
    "longitude" DECIMAL(9,6),
    "latitude" DECIMAL(9,6),
    "speed_kmh" DECIMAL(6,2),
    "accelerometer" DECIMAL(8,4),
    "gyroscope_x" DECIMAL(8,4),
    "gyroscope_y" DECIMAL(8,4),
    "gyroscope_z" DECIMAL(8,4),
    "rpm" INTEGER,
    "coolant_temp_c" DECIMAL(5,2),
    "fuel_trim_percent" DECIMAL(5,2),
    "throttle_position" DECIMAL(5,2),
    "dtc_codes" TEXT[],

    CONSTRAINT "trip_readings_pkey" PRIMARY KEY ("reading_id")
);

-- CreateTable
CREATE TABLE "trip_scores" (
    "score_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "safety_score" DECIMAL(5,2),
    "eco_score" DECIMAL(5,2),
    "overall_score" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_scores_pkey" PRIMARY KEY ("score_id")
);

-- CreateTable
CREATE TABLE "trips" (
    "trip_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "start_time" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMPTZ(6),
    "start_longitude" DECIMAL(9,6),
    "start_latitude" DECIMAL(9,6),
    "end_longitude" DECIMAL(9,6),
    "end_latitude" DECIMAL(9,6),
    "route_polyline" TEXT,
    "distance_km" DECIMAL(9,6),
    "duration_minutes" INTEGER,
    "fuel_estimate" DECIMAL(10,2),
    "data_source" VARCHAR(20),
    "status" VARCHAR(20) DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("trip_id")
);

-- CreateTable
CREATE TABLE "trusted_contacts" (
    "contact_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "relationship" VARCHAR(50),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "consent_status" VARCHAR(10) DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trusted_contacts_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "user_badge_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_badge_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "surname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "consent_status" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(10) DEFAULT 'ACTIVE',
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "vehicle_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "registration" VARCHAR(20),
    "make" VARCHAR(50),
    "model" VARCHAR(50),
    "year" INTEGER,
    "fuel_type" VARCHAR(20),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("vehicle_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_user_id_category_scope_key" ON "leaderboard"("user_id", "category", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "alert_notifications" ADD CONSTRAINT "alert_notifications_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("alert_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_notifications" ADD CONSTRAINT "alert_notifications_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "trusted_contacts"("contact_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alert_preferences" ADD CONSTRAINT "alert_preferences_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "trusted_contacts"("contact_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "badge_criteria" ADD CONSTRAINT "badge_criteria_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("badge_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leaderboard" ADD CONSTRAINT "leaderboard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_events" ADD CONSTRAINT "trip_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_readings" ADD CONSTRAINT "trip_readings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip_scores" ADD CONSTRAINT "trip_scores_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("badge_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
