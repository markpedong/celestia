import sharp from 'sharp';
import { ACCEPTED_IMAGE_TYPES, IMAGE_CACHE_CONTROL, MAX_IMAGE_BYTES, MAX_POST_IMAGES } from '@/constants';
import { HTTP_MESSAGE } from '@/constants/enums';
import { getCurrentUserID } from '@/lib/auth';
import { getUploadErrorMessage } from '@/lib/error-messages';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ImageBucket } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

const IMAGE_BUCKETS = new Set<ImageBucket>(['profile-avatars', 'profile-covers', 'community-avatars', 'community-covers', 'post-images']);
const STORAGE_PATH_PREFIX = '/storage/v1/object/public/';

const validateImage = (value: File) => {
  if (!ACCEPTED_IMAGE_TYPES.has(value.type)) throw new Error('Use a PNG, JPEG, WebP, or GIF image.');
  if (value.size > MAX_IMAGE_BYTES) throw new Error('Images must be 2 MB or smaller.');
};

const optimizeImage = async (value: File) =>
  sharp(Buffer.from(await value.arrayBuffer()), { animated: value.type === 'image/gif' })
    .rotate()
    .webp({ quality: 80, effort: 6 })
    .toBuffer();

const getImageBucket = (value: FormDataEntryValue | null): ImageBucket => {
  if (typeof value !== 'string' || !IMAGE_BUCKETS.has(value as ImageBucket)) throw new Error('Invalid image bucket.');
  return value as ImageBucket;
};

const uploadImages = async (values: FormDataEntryValue[], bucket: ImageBucket, userID: string) => {
  const files = values.filter((value): value is File => value instanceof File && value.size > 0);
  const maxImages = bucket === 'post-images' ? MAX_POST_IMAGES : 1;
  if (files.length > maxImages) throw new Error(`Upload up to ${maxImages} image${maxImages === 1 ? '' : 's'}.`);
  files.forEach(validateImage);

  const supabase = createSupabaseAdminClient();
  return Promise.all(files.map(async file => {
    const path = `${userID}/${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage.from(bucket).upload(path, await optimizeImage(file), {
      cacheControl: IMAGE_CACHE_CONTROL,
      contentType: 'image/webp',
      upsert: false,
    });
    if (error) throw new Error(error.message);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }));
};

const removeImages = async (imageUrls: unknown, bucket: ImageBucket) => {
  if (!Array.isArray(imageUrls)) throw new Error('Choose images to remove.');

  const pathPrefix = `${STORAGE_PATH_PREFIX}${bucket}/`;
  const paths = imageUrls.flatMap(imageUrl => {
    if (typeof imageUrl !== 'string') return [];

    try {
      const { pathname } = new URL(imageUrl);
      const pathIndex = pathname.indexOf(pathPrefix);
      return pathIndex >= 0 ? [decodeURIComponent(pathname.slice(pathIndex + pathPrefix.length))] : [];
    } catch {
      return [];
    }
  });

  if (paths.length === 0) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(error.message);
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

  try {
    const formData = await request.formData();
    const bucket = getImageBucket(formData.get('bucket') ?? 'post-images');
    const imageUrls = await uploadImages(formData.getAll('images'), bucket, userID);
    return generateSuccessResponse({ imageUrls }, 201, 'Images uploaded.');
  } catch (error) {
    return generateErrorResponse(getUploadErrorMessage(error, 'We could not upload your images. Please try again.'));
  }
};

export const DELETE = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

  try {
    const { bucket = 'post-images', imageUrls } = await request.json();
    if (!IMAGE_BUCKETS.has(bucket)) throw new Error('Invalid image bucket.');
    await removeImages(imageUrls, bucket);
    return generateSuccessResponse(null, 200, 'Images removed.');
  } catch (error) {
    return generateErrorResponse(getUploadErrorMessage(error, 'We could not remove your images. Please try again.'));
  }
};
