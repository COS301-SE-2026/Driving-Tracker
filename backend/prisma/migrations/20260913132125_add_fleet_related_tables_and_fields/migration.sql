-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('ADMIN', 'MANAGER', 'DRIVER');

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "planned_dest_lat" DECIMAL(9,6),
ADD COLUMN     "planned_dest_lng" DECIMAL(9,6),
ADD COLUMN     "planned_end_addr" VARCHAR(255),
ADD COLUMN     "planned_start_addr" VARCHAR(255),
ADD COLUMN     "scheduled_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "org_id" UUID;

-- CreateTable
CREATE TABLE "organizations" (
    "org_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("org_id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'DRIVER',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("org_id","user_id")
);

-- CreateTable
CREATE TABLE "vehicle_live_status" (
    "vehicle_id" UUID NOT NULL,
    "current_trip_id" UUID,
    "last_latitude" DECIMAL(9,6),
    "last_longitude" DECIMAL(9,6),
    "last_speed_kmh" DECIMAL(5,2),
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "last_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_live_status_pkey" PRIMARY KEY ("vehicle_id")
);

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_live_status" ADD CONSTRAINT "vehicle_live_status_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;
