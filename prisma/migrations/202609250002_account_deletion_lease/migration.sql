-- Acquire a per-account deletion claim before contacting Supabase Auth or Storage.
-- Expired leases can be recovered after worker crashes.
ALTER TABLE "account_deletions"
  ADD COLUMN "lease_token" TEXT,
  ADD COLUMN "lease_expires_at" TIMESTAMPTZ(6);

CREATE INDEX "account_deletions_lease_expires_at_idx"
  ON "account_deletions" ("lease_expires_at");
