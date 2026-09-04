/*
  Warnings:

  - Made the column `fuel_tank` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "fuel_consumed" DECIMAL(10,4);

UPDATE "vehicles" SET "fuel_tank" = 60 WHERE "fuel_tank" IS NULL;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "engine_type" VARCHAR(100),
ALTER COLUMN "fuel_tank" SET NOT NULL;

-- CreateTable
CREATE TABLE "manufacturer_efficiency_cache" (
    "cache_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "engine_type" VARCHAR(100) NOT NULL,
    "official_efficiency_l_100km" DECIMAL(10,4) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_efficiency_cache_pkey" PRIMARY KEY ("cache_id")
);

-- CreateIndex
CREATE INDEX "manufacturer_efficiency_cache_make_model_year_engine_type_idx" ON "manufacturer_efficiency_cache"("make", "model", "year", "engine_type");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturer_efficiency_cache_make_model_year_engine_type_key" ON "manufacturer_efficiency_cache"("make", "model", "year", "engine_type");

-- CreateIndex
CREATE INDEX "trips_status_end_time_vehicle_id_user_id_idx" ON "trips"("status", "end_time", "vehicle_id", "user_id");

-- CreateIndex
CREATE INDEX "vehicles_make_model_year_engine_type_idx" ON "vehicles"("make", "model", "year", "engine_type");
