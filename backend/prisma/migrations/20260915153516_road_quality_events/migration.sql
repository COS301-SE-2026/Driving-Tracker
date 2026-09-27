-- CreateTable
CREATE TABLE "road_quality_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "intensity" DOUBLE PRECISION NOT NULL,
    "event_type" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "road_quality_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "road_quality_events_latitude_longitude_idx" ON "road_quality_events"("latitude", "longitude");
