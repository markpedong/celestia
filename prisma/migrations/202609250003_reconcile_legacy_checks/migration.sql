-- The pre-existing Celestia test database was created outside Prisma Migrate.
-- Its tables, indexes, foreign keys, chat triggers and RLS policies matched the
-- recorded baseline, but some hand-authored CHECK constraints were absent.
-- This additive migration restores the missing safeguards. On databases built
-- from the full migration history, each guard already exists and is left alone.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votes_value_check' AND conrelid = 'public.votes'::regclass) THEN
    ALTER TABLE public.votes ADD CONSTRAINT votes_value_check CHECK (value IN (-1, 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'votes_target_type_check' AND conrelid = 'public.votes'::regclass) THEN
    ALTER TABLE public.votes ADD CONSTRAINT votes_target_type_check CHECK (target_type IN ('post', 'comment'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_body_length_check' AND conrelid = 'public.comments'::regclass) THEN
    ALTER TABLE public.comments ADD CONSTRAINT comments_body_length_check CHECK (char_length(trim(body)) BETWEEN 1 AND 10000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_actions_kind_check' AND conrelid = 'public.content_actions'::regclass) THEN
    ALTER TABLE public.content_actions ADD CONSTRAINT content_actions_kind_check CHECK (kind IN ('saved', 'hidden', 'followed', 'muted'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_actions_shape_check' AND conrelid = 'public.content_actions'::regclass) THEN
    ALTER TABLE public.content_actions ADD CONSTRAINT content_actions_shape_check CHECK (
      (kind = 'saved' AND target_type IN ('post', 'comment')) OR
      (kind = 'hidden' AND target_type = 'post') OR
      (kind = 'followed' AND target_type = 'user') OR
      (kind = 'muted' AND target_type = 'community')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_target_type_check' AND conrelid = 'public.reports'::regclass) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_target_type_check CHECK (target_type IN ('post', 'comment', 'user'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_status_check' AND conrelid = 'public.reports'::regclass) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_status_check CHECK (status IN ('pending', 'approved', 'dismissed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_reason_length_check' AND conrelid = 'public.reports'::regclass) THEN
    ALTER TABLE public.reports ADD CONSTRAINT reports_reason_length_check CHECK (char_length(trim(reason)) BETWEEN 3 AND 500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_type_check' AND conrelid = 'public.notifications'::regclass) THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('comment', 'reply', 'follow', 'moderator', 'community_invite'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_message_length_check' AND conrelid = 'public.notifications'::regclass) THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_message_length_check CHECK (char_length(trim(message)) BETWEEN 1 AND 500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_href_check' AND conrelid = 'public.notifications'::regclass) THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_href_check CHECK (href LIKE '/%');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_conversations_type_check' AND conrelid = 'public.chat_conversations'::regclass) THEN
    ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_type_check CHECK (type IN ('community', 'direct'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_conversations_shape_check' AND conrelid = 'public.chat_conversations'::regclass) THEN
    ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_shape_check CHECK (
      (type = 'community' AND community_slug IS NOT NULL AND direct_key IS NULL) OR
      (type = 'direct' AND community_slug IS NULL AND direct_key IS NOT NULL)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_body_check' AND conrelid = 'public.chat_messages'::regclass) THEN
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_body_check CHECK (char_length(trim(body)) BETWEEN 1 AND 2000);
  END IF;
END
$$;
