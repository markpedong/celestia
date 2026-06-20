import { z } from 'zod';

export const postSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters.').max(300, 'Title must be 300 characters or fewer.'),
  body: z.string().trim().max(10_000, 'Post body must be 10,000 characters or fewer.'),
  communitySlug: z.string().min(1, 'Choose a community.'),
});

export const editPostSchema = postSchema.pick({ title: true, body: true });

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty.').max(10_000, 'Comment must be 10,000 characters or fewer.'),
});

const communityFields = {
  label: z.string().trim().min(3, 'Community name must be at least 3 characters.').max(60, 'Community name must be 60 characters or fewer.'),
  description: z.string().trim().max(500, 'Description must be 500 characters or fewer.'),
  hashColor: z.string().regex(/^#[0-9a-f]{6}$/i, 'Choose a valid hex color.'),
};

export const createCommunitySchema = z.object({
  ...communityFields,
  slug: z.string().trim().min(3, 'Community URL must be at least 3 characters.').max(32, 'Community URL must be 32 characters or fewer.').regex(/^[a-zA-Z0-9 _-]+$/, 'Use letters, numbers, spaces, hyphens, or underscores.'),
});

export const communitySettingsSchema = z.object(communityFields);
