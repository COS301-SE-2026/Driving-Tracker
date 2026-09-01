-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "fuel_level_end" DECIMAL(9,6),
ADD COLUMN     "fuel_level_start" DECIMAL(9,6);

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "fuel_efficiency" DECIMAL(9,6),
ADD COLUMN     "fuel_tank" DECIMAL(9,6);
