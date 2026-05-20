/*
  Warnings:

  - The `consent_status` column on the `trusted_contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterTable
ALTER TABLE "trusted_contacts" DROP COLUMN "consent_status",
ADD COLUMN     "consent_status" "ConsentStatus" DEFAULT 'PENDING';
