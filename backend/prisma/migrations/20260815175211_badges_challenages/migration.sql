-- AlterTable
ALTER TABLE "badges" ADD COLUMN     "weekly_challenge_id" UUID;

-- CreateTable
CREATE TABLE "weekly_challenges" (
    "challenge_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "target_trips" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMPTZ(6) NOT NULL,
    "end_date" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "weekly_challenges_pkey" PRIMARY KEY ("challenge_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_challenges_name_key" ON "weekly_challenges"("name");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_weekly_challenge_id_fkey" FOREIGN KEY ("weekly_challenge_id") REFERENCES "weekly_challenges"("challenge_id") ON DELETE SET NULL ON UPDATE CASCADE;
