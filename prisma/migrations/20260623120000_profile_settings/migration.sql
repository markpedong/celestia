ALTER TABLE "user_profiles"
  ADD COLUMN "display_name" TEXT,
  ADD COLUMN "bio" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "gender" VARCHAR(32),
  ADD COLUMN "location" VARCHAR(120);
