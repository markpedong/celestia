CREATE TABLE "content_actions" (
  "user_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_actions_pkey" PRIMARY KEY ("user_id", "kind", "target_type", "target_id"),
  CONSTRAINT "content_actions_kind_check" CHECK ("kind" IN ('saved', 'hidden', 'followed', 'muted')),
  CONSTRAINT "content_actions_shape_check" CHECK (
    ("kind" = 'saved' AND "target_type" IN ('post', 'comment')) OR
    ("kind" = 'hidden' AND "target_type" = 'post') OR
    ("kind" = 'followed' AND "target_type" = 'user') OR
    ("kind" = 'muted' AND "target_type" = 'community')
  )
);

CREATE INDEX "content_actions_user_id_kind_created_at_idx"
  ON "content_actions"("user_id", "kind", "created_at");
CREATE INDEX "content_actions_kind_target_type_target_id_idx"
  ON "content_actions"("kind", "target_type", "target_id");

CREATE TABLE "reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reporter_id" TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "community_slug" TEXT,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewed_by_id" TEXT,
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reports_target_type_check" CHECK ("target_type" IN ('post', 'comment', 'user')),
  CONSTRAINT "reports_status_check" CHECK ("status" IN ('pending', 'approved', 'dismissed')),
  CONSTRAINT "reports_reason_length_check" CHECK (char_length(trim("reason")) BETWEEN 3 AND 500)
);

CREATE UNIQUE INDEX "reports_reporter_id_target_type_target_id_key"
  ON "reports"("reporter_id", "target_type", "target_id");
CREATE INDEX "reports_community_slug_status_created_at_idx"
  ON "reports"("community_slug", "status", "created_at");
CREATE INDEX "reports_reporter_id_created_at_idx"
  ON "reports"("reporter_id", "created_at");
