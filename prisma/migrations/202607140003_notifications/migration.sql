CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "actor_id" TEXT,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "read_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_type_check" CHECK ("type" IN ('comment', 'reply', 'follow', 'moderator', 'community_invite')),
  CONSTRAINT "notifications_message_length_check" CHECK (char_length(trim("message")) BETWEEN 1 AND 500),
  CONSTRAINT "notifications_href_check" CHECK ("href" LIKE '/%')
);

CREATE INDEX "notifications_user_id_read_at_created_at_idx"
  ON "notifications"("user_id", "read_at", "created_at");
