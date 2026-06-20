import { config } from 'dotenv';
import { createSupabaseAdminClient } from '../lib/supabase/admin';

config({ path: '.env.local' });
config();

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const buckets = ['profile-avatars', 'profile-covers', 'post-images'];

const main = async () => {
  const supabase = createSupabaseAdminClient();

  for (const id of buckets) {
    const { error } = await supabase.storage.createBucket(id, {
      public: true,
      fileSizeLimit: '2MB',
      allowedMimeTypes: imageMimeTypes,
    });

    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Could not create ${id}: ${error.message}`);
    }

    console.log(`Ready: ${id}`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
