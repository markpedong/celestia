create table "chat_conversations" (
  "id" uuid not null default gen_random_uuid(),
  "type" text not null,
  "community_slug" text,
  "direct_key" text,
  "created_at" timestamptz(6) not null default current_timestamp,
  "updated_at" timestamptz(6) not null default current_timestamp,

  constraint "chat_conversations_pkey" primary key ("id"),
  constraint "chat_conversations_community_slug_fkey" foreign key ("community_slug") references "community"("slug") on delete cascade on update cascade,
  constraint "chat_conversations_type_check" check ("type" in ('community', 'direct')),
  constraint "chat_conversations_shape_check" check (
    ("type" = 'community' and "community_slug" is not null and "direct_key" is null) or
    ("type" = 'direct' and "community_slug" is null and "direct_key" is not null)
  )
);

create unique index "chat_conversations_community_slug_key" on "chat_conversations"("community_slug");
create unique index "chat_conversations_direct_key_key" on "chat_conversations"("direct_key");
create index "chat_conversations_type_updated_at_idx" on "chat_conversations"("type", "updated_at");

create table "chat_participants" (
  "conversation_id" uuid not null,
  "user_id" text not null,
  "last_read_at" timestamptz(6),
  "created_at" timestamptz(6) not null default current_timestamp,

  constraint "chat_participants_pkey" primary key ("conversation_id", "user_id"),
  constraint "chat_participants_conversation_id_fkey" foreign key ("conversation_id") references "chat_conversations"("id") on delete cascade on update cascade,
  constraint "chat_participants_user_id_fkey" foreign key ("user_id") references "users"("id") on delete cascade on update cascade
);

create index "chat_participants_user_id_created_at_idx" on "chat_participants"("user_id", "created_at");

create table "chat_messages" (
  "id" uuid not null default gen_random_uuid(),
  "conversation_id" uuid not null,
  "author_id" text not null,
  "body" text not null,
  "created_at" timestamptz(6) not null default current_timestamp,
  "deleted_at" timestamptz(6),

  constraint "chat_messages_pkey" primary key ("id"),
  constraint "chat_messages_conversation_id_fkey" foreign key ("conversation_id") references "chat_conversations"("id") on delete cascade on update cascade,
  constraint "chat_messages_author_id_fkey" foreign key ("author_id") references "users"("id") on delete cascade on update cascade,
  constraint "chat_messages_body_check" check (char_length(trim("body")) between 1 and 2000)
);

create index "chat_messages_conversation_id_created_at_idx" on "chat_messages"("conversation_id", "created_at");
create index "chat_messages_author_id_created_at_idx" on "chat_messages"("author_id", "created_at");

create or replace function public.touch_chat_conversation()
returns trigger
language plpgsql
as $$
begin
  update public.chat_conversations
  set updated_at = current_timestamp
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger chat_messages_touch_conversation
after insert on public.chat_messages
for each row execute function public.touch_chat_conversation();

create or replace function public.broadcast_chat_message()
returns trigger
language plpgsql
security definer
as $$
begin
  perform realtime.broadcast_changes(
    'chat:conversation:' || new.conversation_id::text,
    'INSERT',
    'INSERT',
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return null;
end;
$$;

create trigger chat_messages_broadcast_insert
after insert on public.chat_messages
for each row execute function public.broadcast_chat_message();

grant select on public.chat_conversations to authenticated;
grant select on public.chat_participants to authenticated;
grant select on public.chat_messages to authenticated;

alter table public.chat_conversations enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;

create policy "Chat participants can read conversations"
on public.chat_conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_participants cp
    where cp.conversation_id = chat_conversations.id
      and cp.user_id = (select auth.uid())::text
  )
);

create policy "Users can read own chat participation"
on public.chat_participants
for select
to authenticated
using (user_id = (select auth.uid())::text);

create policy "Chat participants can read messages"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_participants cp
    where cp.conversation_id = chat_messages.conversation_id
      and cp.user_id = (select auth.uid())::text
  )
);

drop policy if exists "Chat participants can receive broadcast and presence" on realtime.messages;
drop policy if exists "Chat participants can send presence" on realtime.messages;

create policy "Chat participants can receive broadcast and presence"
on realtime.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_participants cp
    where cp.user_id = (select auth.uid())::text
      and ('chat:conversation:' || cp.conversation_id::text) = (select realtime.topic())
      and realtime.messages.extension in ('broadcast', 'presence')
  )
);

create policy "Chat participants can send presence"
on realtime.messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.chat_participants cp
    where cp.user_id = (select auth.uid())::text
      and ('chat:conversation:' || cp.conversation_id::text) = (select realtime.topic())
      and realtime.messages.extension in ('presence')
  )
);
