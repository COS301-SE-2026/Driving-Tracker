ALTER TABLE "vehicles"
    ADD COLUMN IF NOT EXISTS "engine_type" VARCHAR(100);

ALTER TABLE "trips"
    ADD COLUMN IF NOT EXISTS "fuel_CONSUMED" DECIMAL(10,4);

CREATE TABLE IF NOT EXISTS "manufacturer_efficiency_cache" (
    "cache_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "engine_type" VARCHAR(100) NOT NULL,
    "official_efficiency_l_100km" DECIMAL(10,4) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturer_efficiency_cache_pkey"
        PRIMARY KEY ("cache_id")
);

CREATE INDEX IF NOT EXISTS
    "manufacturer_efficiency_cache_make_model_year_engine_type_key"
ON "manufacturer_efficiency_cache"
    ("make", "model", "year", "engine_type");

CREATE INDEX IF NOT EXISTS
    "vehicles_efficiency_specs_idx"
ON "vehicles"
    ("make", "model", "year", "engine_type");

CREATE INDEX IF NOT EXISTS
    "trips_efficiency_aggregation_idx"
ON "trips"
    ("status", "end-time", "vehicle_id", "user_id");