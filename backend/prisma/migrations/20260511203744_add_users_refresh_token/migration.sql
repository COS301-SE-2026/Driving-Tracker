-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token" VARCHAR(512),
ADD COLUMN     "refresh_token_exp" TIMESTAMPTZ(6);
