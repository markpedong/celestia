import { createSupabaseServerClient } from './supabase/server';
import type { ImageBucket } from './types';

const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const maxImageBytes = 2 * 1024 * 1024;

const extensionFor = (mimeType: string) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}[mimeType] ?? 'img');

export const uploadImage = async (
  value: FormDataEntryValue | null,
  bucket: ImageBucket,
  userId: string,
): Promise<string | undefined> => {
  if (!(value instanceof File) || value.size === 0) return undefined;
  if (!acceptedImageTypes.has(value.type)) throw new Error('Use a PNG, JPEG, WebP, or GIF image.');
  if (value.size > maxImageBytes) throw new Error('Images must be 2 MB or smaller.');

  const supabase = await createSupabaseServerClient();
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(value.type)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, value, {
    cacheControl: '31536000',
    contentType: value.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};
