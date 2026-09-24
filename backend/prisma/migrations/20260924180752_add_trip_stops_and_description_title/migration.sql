-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "description" VARCHAR(255),
ADD COLUMN     "title" VARCHAR(100);

-- CreateTable
CREATE TABLE "trip_stops" (
    "stop_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "address" VARCHAR(255),
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'PENDING',
    "reached_at" TIMESTAMPTZ(6),

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("stop_id")
);

-- CreateIndex
CREATE INDEX "trip_stops_trip_id_stop_order_idx" ON "trip_stops"("trip_id", "stop_order");

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE CASCADE;
