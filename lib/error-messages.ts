export const getUploadErrorMessage = (error: unknown, fallback: string): string => {
  const rawMessage = error instanceof Error ? error.message : '';
  const message = rawMessage.toLowerCase();

  if (message.includes('png, jpeg, webp, or gif') || message.includes('2 mb') || message.includes('up to')) {
    return rawMessage || fallback;
  }
  if (message.includes('bucket') || message.includes('storage')) {
    return 'Image storage is not ready yet. Please try again later.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Your image could not be uploaded because the network request failed. Please try again.';
  }
  if (rawMessage) return rawMessage;

  return fallback;
};
