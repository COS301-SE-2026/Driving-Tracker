-- CreateTable
CREATE TABLE "unexpected_stop_events" (
    "event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "status" VARCHAR(25) NOT NULL,
    "classification" VARCHAR(25),
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "address" TEXT,
    "poi_category" VARCHAR(50),
    "stopped_at" TIMESTAMPTZ(6) NOT NULL,
    "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "check_after" TIMESTAMPTZ(6) NOT NULL,
    "escalated_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "unexpected_stop_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "unexpected_stop_events_status_check_after_idx" ON "unexpected_stop_events"("status", "check_after");

-- AddForeignKey
ALTER TABLE "unexpected_stop_events" ADD CONSTRAINT "unexpected_stop_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE NO ACTION;
