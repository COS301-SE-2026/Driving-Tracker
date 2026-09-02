/*
  Warnings:

  - Made the column `fuel_tank` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "fuel_tank" SET NOT NULL;
