/*
  Warnings:

  - A unique constraint covering the columns `[user_id,contact_user_id]` on the table `trusted_contacts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contact_user_id` to the `trusted_contacts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "alerts" ADD COLUMN     "event_id" UUID,
ADD COLUMN     "message" TEXT;

-- AlterTable
ALTER TABLE "trusted_contacts" ADD COLUMN     "contact_user_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "trip_location_shares" (
    "share_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "trip_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "shared_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "trip_location_shares_pkey" PRIMARY KEY ("share_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_location_shares_trip_id_contact_id_key" ON "trip_location_shares"("trip_id", "contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_contacts_user_id_contact_user_id_key" ON "trusted_contacts"("user_id", "contact_user_id");

-- AddForeignKey
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_location_shares" ADD CONSTRAINT "trip_location_shares_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("trip_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_location_shares" ADD CONSTRAINT "trip_location_shares_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_location_shares" ADD CONSTRAINT "trip_location_shares_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "trusted_contacts"("contact_id") ON DELETE CASCADE ON UPDATE CASCADE;
