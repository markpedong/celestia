import { config } from 'dotenv';
import { createSupabaseAdminClient } from '../lib/supabase/admin';

config({ path: '.env' });

const usersPerPage = 1000;

const main = async () => {
  const supabase = createSupabaseAdminClient();
  let deleted = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: usersPerPage });
    if (error) throw new Error(`Could not list Supabase Auth users: ${error.message}`);

    for (const user of data.users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) throw new Error(`Could not delete Supabase Auth user ${user.id}: ${deleteError.message}`);
      deleted += 1;
    }

    if (data.users.length < usersPerPage) break;
  }

  console.log(`Deleted ${deleted} Supabase Auth user${deleted === 1 ? '' : 's'}`);
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
