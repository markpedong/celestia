import {
  MAX_COMMUNITY_SLUG_LENGTH,
  MIN_COMMUNITY_SLUG_LENGTH,
  RESERVED_COMMUNITY_SLUGS,
} from '@/constants';
import { HTTP_MESSAGE } from '@/constants/enums';
import { getCurrentUserID } from '@/lib/auth';
import { getCommunityBySlug, listCommunity } from '@/lib/db/community.queries';
import { communitySettingsSchema } from '@/lib/form-schemas';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { isOwnedPublicFileUrl } from '@/lib/storage';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { revalidatePath } from 'next/cache';

export const GET = async (request: Request,) => {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? '';

  if (!slug) return generateSuccessResponse(await listCommunity());

  const community = await getCommunityBySlug(slug);
  if (!community) return generateErrorResponse('Community not found.', 404);

  return generateSuccessResponse(community);
};

const revalidateCommunityPaths = (slug: string) => {
  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${slug}`);
  revalidatePath(`/r/${slug}/settings`);
  revalidatePath(`/settings/communities/${slug}`);
};

const normalizeSlug = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, MAX_COMMUNITY_SLUG_LENGTH);

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);
  if (!await checkRateLimit(`community-create:${userID}`, 5, 3600)) {
    return generateErrorResponse('Community creation limit reached. Try again later.', 429);
  }

  const { slug, label, description, hashColor, avatarUrl, coverUrl } = await request.json();
  const communitySlug = normalizeSlug(String(slug ?? ''));
  const parsed = communitySettingsSchema.safeParse({ label, description, hashColor });
  if (!parsed.success) return generateErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid community.');

  if (communitySlug.length < MIN_COMMUNITY_SLUG_LENGTH || RESERVED_COMMUNITY_SLUGS.has(communitySlug)) {
    return generateErrorResponse('Choose a different community URL.');
  }

  const existing = await prisma.community.findUnique({ where: { slug: communitySlug }, select: { slug: true } });
  if (existing) return generateErrorResponse('That community URL is already taken.');
  if (avatarUrl && (typeof avatarUrl !== 'string' || !isOwnedPublicFileUrl(avatarUrl, 'community-avatars', userID))) {
    return generateErrorResponse('Invalid community profile image.');
  }
  if (coverUrl && (typeof coverUrl !== 'string' || !isOwnedPublicFileUrl(coverUrl, 'community-covers', userID))) {
    return generateErrorResponse('Invalid community cover image.');
  }

  await prisma.$transaction(async tx => {
    await tx.community.create({
      data: {
        slug: communitySlug,
        label: parsed.data.label,
        description: parsed.data.description,
        hashColor: parsed.data.hashColor,
        avatarUrl: avatarUrl || undefined,
        coverUrl: coverUrl || undefined,
        createdByID: userID,
      },
    });
    await tx.communityMembers.create({ data: { userID, communitySlug } });
  });

  revalidatePath('/');
  revalidatePath('/submit');

  return generateSuccessResponse({ slug: communitySlug });
};

export const PATCH = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);
  if (!await checkRateLimit(`community-edit:${userID}`, 30, 600)) {
    return generateErrorResponse('Community update limit reached. Try again later.', 429);
  }

  const { slug, label, description, hashColor, avatarUrl, coverUrl } = await request.json();

  const community = await prisma.community.findUnique({
    where: { slug },
    select: { createdByID: true, label: true, description: true, hashColor: true },
  });
  if (!community) return generateErrorResponse('Community not found.', 404);
  if (community.createdByID !== userID) {
    return generateErrorResponse('Only the community owner can change these settings.', 403);
  }
  const parsed = communitySettingsSchema.safeParse({
    label: label ?? community.label,
    description: description ?? community.description,
    hashColor: hashColor ?? community.hashColor,
  });
  if (!parsed.success) return generateErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid community settings.');
  if (avatarUrl !== undefined && avatarUrl !== null && avatarUrl !== '' &&
      (typeof avatarUrl !== 'string' || !isOwnedPublicFileUrl(avatarUrl, 'community-avatars', userID))) {
    return generateErrorResponse('Invalid community profile image.');
  }
  if (coverUrl !== undefined && coverUrl !== null && coverUrl !== '' &&
      (typeof coverUrl !== 'string' || !isOwnedPublicFileUrl(coverUrl, 'community-covers', userID))) {
    return generateErrorResponse('Invalid community cover image.');
  }

  const updatedCommunity = await prisma.community.update({
    where: { slug },
    data: {
      label: parsed.data.label,
      description: parsed.data.description,
      hashColor: parsed.data.hashColor,
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
      ...(coverUrl !== undefined ? { coverUrl: coverUrl || null } : {}),
    },
  });

  revalidateCommunityPaths(slug);

  return generateSuccessResponse(updatedCommunity);
};
