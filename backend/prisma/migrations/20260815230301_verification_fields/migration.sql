-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_reset_token" VARCHAR(255),
ADD COLUMN     "reset_token_exp" TIMESTAMPTZ(6),
ADD COLUMN     "verification_token" VARCHAR(255);
