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
  create trigger user_profiles_username_immutable
  before update of username on public.users
  for each row execute function public.prevent_username_change();
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
