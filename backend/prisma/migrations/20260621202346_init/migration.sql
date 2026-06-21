/*
  Warnings:

  - You are about to drop the column `user_id` on the `vehicles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_user_id_fkey";

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "user_id",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "users_vehicles" (
    "assignment_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_vehicles_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_vehicles_user_id_vehicle_id_key" ON "users_vehicles"("user_id", "vehicle_id");

-- AddForeignKey
ALTER TABLE "users_vehicles" ADD CONSTRAINT "users_vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_vehicles" ADD CONSTRAINT "users_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("vehicle_id") ON DELETE CASCADE ON UPDATE CASCADE;
