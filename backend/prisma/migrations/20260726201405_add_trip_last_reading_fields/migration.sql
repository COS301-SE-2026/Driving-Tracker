-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "last_latitude" DECIMAL(9,6),
ADD COLUMN     "last_longitude" DECIMAL(9,6),
ADD COLUMN     "last_recorded_at" TIMESTAMPTZ(6),
ADD COLUMN     "last_speed_kmh" DECIMAL(6,2);
