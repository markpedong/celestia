import { config } from 'dotenv';
import { createSupabaseAdminClient } from '../lib/supabase/admin';

config({ path: '.env' });

const buckets = ['profile-avatars', 'profile-covers', 'community-avatars', 'community-covers', 'post-images'];
const batchSize = 1000;

const listObjectPaths = async (bucket: string, prefix = ''): Promise<string[]> => {
  const supabase = createSupabaseAdminClient();
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: batchSize, offset });
    if (error) throw new Error(`Could not list ${bucket}: ${error.message}`);

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) paths.push(path);
      else paths.push(...await listObjectPaths(bucket, path));
    }

    if (data.length < batchSize) return paths;
    offset += data.length;
  }
};

const emptyBucket = async (bucket: string) => {
  const supabase = createSupabaseAdminClient();
  const paths = await listObjectPaths(bucket);

  for (let index = 0; index < paths.length; index += batchSize) {
    const { error } = await supabase.storage.from(bucket).remove(paths.slice(index, index + batchSize));
    if (error) throw new Error(`Could not empty ${bucket}: ${error.message}`);
  }

  console.log(`Emptied ${bucket} (${paths.length} object${paths.length === 1 ? '' : 's'})`);
};

const main = async () => {
  for (const bucket of buckets) await emptyBucket(bucket);
};

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
