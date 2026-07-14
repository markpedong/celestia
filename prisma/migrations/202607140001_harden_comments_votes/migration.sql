ALTER TABLE "comments"
  ADD COLUMN "edited_at" TIMESTAMPTZ(6),
  ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

UPDATE "comments" AS child
SET "parent_id" = NULL
WHERE child."parent_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "comments" AS parent WHERE parent."id" = child."parent_id"
  );

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "comments"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "comments_parent_id_created_at_idx" ON "comments"("parent_id", "created_at");

DELETE FROM "votes" WHERE "value" NOT IN (-1, 1) OR "target_type" NOT IN ('post', 'comment');

ALTER TABLE "votes"
  ADD CONSTRAINT "votes_value_check" CHECK ("value" IN (-1, 1)),
  ADD CONSTRAINT "votes_target_type_check" CHECK ("target_type" IN ('post', 'comment'));

ALTER TABLE "comments"
  ADD CONSTRAINT "comments_body_length_check"
  CHECK (char_length(trim("body")) BETWEEN 1 AND 10000) NOT VALID;
