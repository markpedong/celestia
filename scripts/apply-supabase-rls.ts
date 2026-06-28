import { config as loadEnv } from 'dotenv';
import { Client } from 'pg';
import { normalizeDatabaseUrl } from '../lib/database-url';

loadEnv({ path: '.env.local' });
loadEnv();

async function main() {
  const sql = `
  alter table public.users enable row level security;

  grant usage on schema public to anon, authenticated;
  grant select, insert, update on public.users to authenticated;

  drop policy if exists "Users can read own profile" on public.users;
  drop policy if exists "Users can insert own profile" on public.users;
  drop policy if exists "Users can update own profile" on public.users;

  create policy "Users can read own profile"
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()::text
  );

  create policy "Users can insert own profile"
  on public.users
  for insert
  to authenticated
  with check (
    id = auth.uid()::text
  );

  create policy "Users can update own profile"
  on public.users
  for update
  to authenticated
  using (
    id = auth.uid()::text
  )
  with check (
    id = auth.uid()::text
  );

  create or replace function public.prevent_username_change()
  returns trigger
  language plpgsql
  as $$
  begin
    if new.username is distinct from old.username then
      raise exception 'Username cannot be changed after account creation';
    end if;
    return new;
  end;
  $$;

  drop trigger if exists user_profiles_username_immutable on public.users;
  drop trigger if exists users_username_immutable on public.users;
  create trigger users_username_immutable
  before update of username on public.users
  for each row execute function public.prevent_username_change();

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

  drop trigger if exists chat_messages_touch_conversation on public.chat_messages;
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

  drop trigger if exists chat_messages_broadcast_insert on public.chat_messages;
  create trigger chat_messages_broadcast_insert
  after insert on public.chat_messages
  for each row execute function public.broadcast_chat_message();

  grant select on public.chat_conversations to authenticated;
  grant select on public.chat_participants to authenticated;
  grant select on public.chat_messages to authenticated;

  alter table public.chat_conversations enable row level security;
  alter table public.chat_participants enable row level security;
  alter table public.chat_messages enable row level security;

  drop policy if exists "Chat participants can read conversations" on public.chat_conversations;
  drop policy if exists "Users can read own chat participation" on public.chat_participants;
  drop policy if exists "Chat participants can read messages" on public.chat_messages;

  create policy "Chat participants can read conversations"
  on public.chat_conversations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_participants cp
      where cp.conversation_id = chat_conversations.id
        and cp.user_id = auth.uid()::text
    )
  );

  create policy "Users can read own chat participation"
  on public.chat_participants
  for select
  to authenticated
  using (user_id = auth.uid()::text);

  create policy "Chat participants can read messages"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_participants cp
      where cp.conversation_id = chat_messages.conversation_id
        and cp.user_id = auth.uid()::text
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
      where cp.user_id = auth.uid()::text
        and ('chat:conversation:' || cp.conversation_id::text) = realtime.topic()
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
      where cp.user_id = auth.uid()::text
        and ('chat:conversation:' || cp.conversation_id::text) = realtime.topic()
        and realtime.messages.extension in ('presence')
    )
  );
  `;

  const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);

  if (!connectionString) {
    throw new Error('DATABASE_URL is required.');
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    await client.query(sql);
    console.log('Applied Supabase RLS policies.');
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
