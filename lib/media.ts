import { createSupabaseServerClient } from './supabase/server';
import { ACCEPTED_IMAGE_TYPES, IMAGE_CACHE_CONTROL, MAX_IMAGE_BYTES, MAX_POST_IMAGES } from '../constants';
import type { ImageBucket } from './types';

const extensionFor = (mimeType: string) => ({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}[mimeType] ?? 'img');

const validateImage = (value: File) => {
  if (!ACCEPTED_IMAGE_TYPES.has(value.type)) throw new Error('Use a PNG, JPEG, WebP, or GIF image.');
  if (value.size > MAX_IMAGE_BYTES) throw new Error('Images must be 2 MB or smaller.');
};

export const uploadImage = async (
  value: FormDataEntryValue | null,
  bucket: ImageBucket,
  userId: string,
): Promise<string | undefined> => {
  if (!(value instanceof File) || value.size === 0) return undefined;
  validateImage(value);

  const supabase = await createSupabaseServerClient();
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(value.type)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, value, {
    cacheControl: IMAGE_CACHE_CONTROL,
    contentType: value.type,
    upsert: false,
  });

  if (error) throw new Error(error.message);

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

export const uploadPostImages = async (values: FormDataEntryValue[], userId: string): Promise<string[]> => {
  const files = values.filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length > MAX_POST_IMAGES) {
    throw new Error(`Upload up to ${MAX_POST_IMAGES} images per post.`);
  }

  files.forEach(validateImage);

  return Promise.all(files.map(async file => {
    const imageUrl = await uploadImage(file, 'post-images', userId);
    if (!imageUrl) throw new Error('Unable to upload image.');
    return imageUrl;
  }));
};

export const removePostImages = async (imageUrls: string[]): Promise<void> => {
  const pathPrefix = '/storage/v1/object/public/post-images/';
  const paths = imageUrls.flatMap(imageUrl => {
    try {
      const { pathname } = new URL(imageUrl);
      return pathname.startsWith(pathPrefix) ? [decodeURIComponent(pathname.slice(pathPrefix.length))] : [];
    } catch {
      return [];
    }
  });

  if (paths.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from('post-images').remove(paths);
  if (error) throw new Error(error.message);
};
