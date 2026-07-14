import type { ImageBucket } from '@/lib/types';

export const FILES_BASE_URL = 'https://files.ivory.atlascelestia.site';

const FILES_HOSTNAME = new URL(FILES_BASE_URL).hostname;
const SUPABASE_STORAGE_HOSTNAME = 'vmqvrslwbsdsfcyvocfm.supabase.co';
const SUPABASE_STORAGE_PATH_PREFIX = '/storage/v1/object/public/';

export const getPublicFileUrl = (bucket: ImageBucket, path: string) =>
  `${FILES_BASE_URL}/${bucket}/${path}`;

export const parsePublicFileUrl = (imageUrl: string) => {
  try {
    const { hostname, pathname } = new URL(imageUrl);

    if (hostname === FILES_HOSTNAME) {
      const [bucket, ...pathParts] = pathname.split('/').filter(Boolean);
      const path = pathParts.join('/');
      return bucket && path ? { bucket, path: decodeURIComponent(path) } : null;
    }

    if (hostname === SUPABASE_STORAGE_HOSTNAME && pathname.startsWith(SUPABASE_STORAGE_PATH_PREFIX)) {
      const [bucket, ...pathParts] = pathname.slice(SUPABASE_STORAGE_PATH_PREFIX.length).split('/');
      const path = pathParts.join('/');
      return bucket && path ? { bucket, path: decodeURIComponent(path) } : null;
    }
  } catch {
    return null;
  }

  return null;
};

export const isOwnedPublicFileUrl = (
  imageUrl: string,
  bucket: ImageBucket,
  userID: string,
) => {
  const file = parsePublicFileUrl(imageUrl);
  return file?.bucket === bucket && file.path.startsWith(`${userID}/`);
};
