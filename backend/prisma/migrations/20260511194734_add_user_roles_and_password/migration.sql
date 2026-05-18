/*
  Warnings:

  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_hash" VARCHAR(255) NOT NULL,
ADD COLUMN     "role" "SystemRole" NOT NULL DEFAULT 'USER',
DROP COLUMN "status",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
