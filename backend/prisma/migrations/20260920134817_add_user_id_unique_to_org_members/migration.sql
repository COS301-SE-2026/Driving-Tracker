/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `organization_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "organization_members_user_id_key" ON "organization_members"("user_id");
