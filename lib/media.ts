const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function imageDataUrlFromFile(value: FormDataEntryValue | null): Promise<string | undefined> {
  if (!(value instanceof File) || value.size === 0) return undefined;

  if (!ACCEPTED_IMAGE_TYPES.has(value.type)) {
    throw new Error('Use a PNG, JPEG, WebP, or GIF image.');
  }

  if (value.size > MAX_IMAGE_BYTES) {
    throw new Error('Images must be 2 MB or smaller.');
  }

  const bytes = Buffer.from(await value.arrayBuffer());
  return `data:${value.type};base64,${bytes.toString('base64')}`;
}
