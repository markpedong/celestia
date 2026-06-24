/*
  Warnings:

  - You are about to drop the `community_memberships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "community_memberships" DROP CONSTRAINT "community_memberships_community_slug_fkey";

-- DropForeignKey
ALTER TABLE "post_tags" DROP CONSTRAINT "post_tags_tag_slug_fkey";

-- AlterTable
ALTER TABLE "backup_codes" ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "community_memberships";

-- DropTable
DROP TABLE "tags";

-- DropTable
DROP TABLE "user_profiles";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "hash_color" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "community_members" (
    "user_id" TEXT NOT NULL,
    "community_slug" TEXT NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("user_id","community_slug")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "community_members_community_slug_joined_at_idx" ON "community_members"("community_slug", "joined_at");

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_slug_fkey" FOREIGN KEY ("community_slug") REFERENCES "community"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_slug_fkey" FOREIGN KEY ("tag_slug") REFERENCES "community"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
