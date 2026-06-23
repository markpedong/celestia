import { z } from 'zod';
import {
    MAX_COMMENT_LENGTH,
    MAX_COMMUNITY_DESCRIPTION_LENGTH,
    MAX_COMMUNITY_NAME_LENGTH,
    MAX_COMMUNITY_SLUG_LENGTH,
    MAX_POST_BODY_LENGTH,
    MAX_POST_TITLE_LENGTH,
    MIN_COMMUNITY_NAME_LENGTH,
    MIN_COMMUNITY_SLUG_LENGTH,
    MIN_POST_TITLE_LENGTH,
} from '../constants';

export const postSchema = z.object({
  title: z.string().trim().min(MIN_POST_TITLE_LENGTH, `Title must be at least ${MIN_POST_TITLE_LENGTH} characters.`).max(MAX_POST_TITLE_LENGTH, `Title must be ${MAX_POST_TITLE_LENGTH} characters or fewer.`),
  body: z.string().trim().max(MAX_POST_BODY_LENGTH, `Post body must be ${MAX_POST_BODY_LENGTH.toLocaleString()} characters or fewer.`),
  communitySlug: z.string().min(1, 'Choose a community.'),
});

export const editPostSchema = postSchema.pick({ title: true, body: true });

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty.').max(MAX_COMMENT_LENGTH, `Comment must be ${MAX_COMMENT_LENGTH.toLocaleString()} characters or fewer.`),
});

const communityFields = {
  label: z.string().trim().min(MIN_COMMUNITY_NAME_LENGTH, `Community name must be at least ${MIN_COMMUNITY_NAME_LENGTH} characters.`).max(MAX_COMMUNITY_NAME_LENGTH, `Community name must be ${MAX_COMMUNITY_NAME_LENGTH} characters or fewer.`),
  description: z.string().trim().max(MAX_COMMUNITY_DESCRIPTION_LENGTH, `Description must be ${MAX_COMMUNITY_DESCRIPTION_LENGTH} characters or fewer.`),
  hashColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Choose a valid hex color.'),
};

export const createCommunitySchema = z.object({
  ...communityFields,
  slug: z.string().trim().min(MIN_COMMUNITY_SLUG_LENGTH, `Community URL must be at least ${MIN_COMMUNITY_SLUG_LENGTH} characters.`).max(MAX_COMMUNITY_SLUG_LENGTH, `Community URL must be ${MAX_COMMUNITY_SLUG_LENGTH} characters or fewer.`).regex(/^[a-zA-Z0-9 _-]+$/, 'Use letters, numbers, spaces, hyphens, or underscores.'),
});

export const communitySettingsSchema = z.object(communityFields);

export const profileSettingsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(28, 'Username must be 28 characters or fewer.')
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, or underscores.'),
  displayName: z.string().trim().max(80, 'Display name must be 80 characters or fewer.'),
  bio: z.string().trim().max(500, 'About must be 500 characters or fewer.'),
});
