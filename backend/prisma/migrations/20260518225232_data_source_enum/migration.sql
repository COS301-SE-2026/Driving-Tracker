/*
  Warnings:

  - The `data_source` column on the `trip_readings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `data_source` column on the `trips` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('PHONE', 'OBD');

-- AlterTable
ALTER TABLE "trip_readings" DROP COLUMN "data_source",
ADD COLUMN     "data_source" "DataSource" DEFAULT 'OBD';

-- AlterTable
ALTER TABLE "trips" DROP COLUMN "data_source",
ADD COLUMN     "data_source" "DataSource" DEFAULT 'OBD';
