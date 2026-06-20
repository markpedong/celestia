-- Preserve existing single-image posts while moving to the gallery column.
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'image_url'
  ) THEN
    UPDATE "posts"
    SET "image_urls" = ARRAY["image_url"]
    WHERE "image_url" IS NOT NULL
      AND "image_url" <> ''
      AND cardinality("image_urls") = 0;

    ALTER TABLE "posts" DROP COLUMN "image_url";
  END IF;
END $$;
