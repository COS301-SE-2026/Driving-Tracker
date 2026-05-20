/*
  Warnings:

  - Added the required column `dob` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dob" DATE NOT NULL,
ADD COLUMN     "phone_number" VARCHAR(20) NOT NULL,
ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false;
