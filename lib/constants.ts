export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_DISPLAY_NAME_LENGTH = 60;
export const MAX_EMAIL_LENGTH = 254;

export const MIN_POST_TITLE_LENGTH = 4;
export const MAX_POST_TITLE_LENGTH = 300;
export const MAX_POST_BODY_LENGTH = 10_000;
export const MAX_COMMENT_LENGTH = 10_000;

export const MIN_COMMUNITY_NAME_LENGTH = 3;
export const MAX_COMMUNITY_NAME_LENGTH = 60;
export const MIN_COMMUNITY_SLUG_LENGTH = 3;
export const MAX_COMMUNITY_SLUG_LENGTH = 32;
export const MAX_COMMUNITY_DESCRIPTION_LENGTH = 500;
export const RESERVED_COMMUNITY_SLUGS = new Set(['all', 'auth', 'communities', 'new', 'post', 'profile', 'r', 'submit', 'u']);

export const MAX_POST_IMAGES = 4;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(',');
export const ACCEPTED_IMAGE_TYPES = new Set<string>(IMAGE_MIME_TYPES);
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_CACHE_CONTROL = '31536000';
