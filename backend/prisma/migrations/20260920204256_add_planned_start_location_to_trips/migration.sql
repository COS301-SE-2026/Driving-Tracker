/*
  Warnings:

  - You are about to drop the column `scheduled_at` on the `trips` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "trips" DROP COLUMN "scheduled_at",
ADD COLUMN     "planned_start_lat" DECIMAL(9,6),
ADD COLUMN     "planned_start_lng" DECIMAL(9,6),
ADD COLUMN     "scheduled_for" TIMESTAMPTZ(6);
