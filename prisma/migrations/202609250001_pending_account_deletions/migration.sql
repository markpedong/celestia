-- Independent recovery record: do not FK to users, which are deleted during cleanup.
CREATE TABLE "account_deletions" (
  "user_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending_auth',
  "storage_paths" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_deletions_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "account_deletions_status_check" CHECK ("status" IN ('pending_auth', 'pending_cleanup', 'pending_storage'))
);

CREATE INDEX "account_deletions_status_requested_at_idx" ON "account_deletions"("status", "requested_at");

-- This is an internal ledger accessed only by the trusted server-side Prisma
-- connection, never by Supabase client-side access.
ALTER TABLE "account_deletions" ENABLE ROW LEVEL SECURITY;
