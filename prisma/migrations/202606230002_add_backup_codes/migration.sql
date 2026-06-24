CREATE TABLE "backup_codes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "used_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "backup_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "backup_codes_user_id_created_at_idx" ON "backup_codes"("user_id", "created_at");
