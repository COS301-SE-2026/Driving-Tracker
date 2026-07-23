/*
  Warnings:

  - The `route_polyline` column on the `trips` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "trips" DROP COLUMN "route_polyline",
ADD COLUMN     "route_polyline" JSONB;
