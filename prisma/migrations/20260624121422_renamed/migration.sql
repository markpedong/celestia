-- AlterTable
ALTER TABLE "backup_codes" ALTER COLUMN "id" DROP DEFAULT;

-- RenameTable
ALTER TABLE "user_profiles" RENAME TO "users";

-- RenameTrigger
ALTER TRIGGER "user_profiles_username_immutable" ON "users" RENAME TO "users_username_immutable";

-- RenameTable
ALTER TABLE "tags" RENAME TO "community";

-- RenameTable
ALTER TABLE "community_memberships" RENAME TO "community_members";

-- Match the renamed model's required email field without discarding existing profiles.
UPDATE "users" AS profile
SET "email" = auth_user."email"
FROM auth.users AS auth_user
WHERE profile."id" = auth_user."id"::text
  AND profile."email" IS NULL;

ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- RenameIndex
ALTER INDEX "user_profiles_username_key" RENAME TO "users_username_key";

-- RenameIndex
ALTER INDEX "community_memberships_community_slug_joined_at_idx" RENAME TO "community_members_community_slug_joined_at_idx";

-- Rename constraints to match the renamed tables. Their relationships survive the table renames.
ALTER TABLE "community" RENAME CONSTRAINT "tags_pkey" TO "community_pkey";
ALTER TABLE "community_members" RENAME CONSTRAINT "community_memberships_pkey" TO "community_members_pkey";
ALTER TABLE "community_members" RENAME CONSTRAINT "community_memberships_community_slug_fkey" TO "community_members_community_slug_fkey";
