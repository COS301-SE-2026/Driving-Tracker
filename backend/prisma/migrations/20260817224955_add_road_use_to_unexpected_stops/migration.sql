-- AlterTable
ALTER TABLE "unexpected_stop_events" ADD COLUMN     "road_use" TEXT[] DEFAULT ARRAY[]::TEXT[];
