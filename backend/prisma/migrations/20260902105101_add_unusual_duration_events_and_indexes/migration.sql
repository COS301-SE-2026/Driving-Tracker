-- CreateTable
CREATE TABLE "unusual_duration_events" (
    "event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "expected_seconds" INTEGER NOT NULL,
    "moving_seconds_at_flag" INTEGER NOT NULL,
    "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unusual_duration_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "unusual_duration_events_trip_id_idx" ON "unusual_duration_events"("trip_id");

-- CreateIndex
CREATE INDEX "trip_events_trip_id_recorded_at_idx" ON "trip_events"("trip_id", "recorded_at");

-- CreateIndex
CREATE INDEX "trip_location_shares_trip_id_revoked_at_idx" ON "trip_location_shares"("trip_id", "revoked_at");

-- CreateIndex
CREATE INDEX "trips_user_id_created_at_idx" ON "trips"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "trips_user_id_status_idx" ON "trips"("user_id", "status");

-- CreateIndex
CREATE INDEX "trusted_contacts_user_id_consent_status_idx" ON "trusted_contacts"("user_id", "consent_status");

-- AddForeignKey
ALTER TABLE "unusual_duration_events" ADD CONSTRAINT "unusual_duration_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE NO ACTION;
