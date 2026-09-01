/*
  Warnings:

  - A unique constraint covering the columns `[user_id,category,scope,period_start]` on the table `leaderboard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `period_start` to the `leaderboard` table without a default value. This is not possible if the table is not empty.
  - Made the column `fuel_tank` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "leaderboard_user_id_category_scope_key";

-- AlterTable
ALTER TABLE "leaderboard" ADD COLUMN     "period_start" DATE NOT NULL;

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "fuel_tank" SET NOT NULL;

-- CreateIndex
CREATE INDEX "leaderboard_category_scope_period_start_score_idx" ON "leaderboard"("category", "scope", "period_start", "score");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_user_id_category_scope_period_start_key" ON "leaderboard"("user_id", "category", "scope", "period_start");
