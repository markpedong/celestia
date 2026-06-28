import {
  MAX_COMMUNITY_SLUG_LENGTH,
  MIN_COMMUNITY_SLUG_LENGTH,
  RESERVED_COMMUNITY_SLUGS,
} from '@/constants';
import { HTTP_MESSAGE } from '@/constants/enums';
import { getCurrentUserID } from '@/lib/auth';
import { getCommunityBySlug, listCommunity } from '@/lib/db/community.queries';
import { prisma } from '@/lib/prisma';
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

  const { slug, label, description, hashColor, avatarUrl, coverUrl } = await request.json();
  const communitySlug = normalizeSlug(String(slug ?? ''));

  if (communitySlug.length < MIN_COMMUNITY_SLUG_LENGTH || RESERVED_COMMUNITY_SLUGS.has(communitySlug)) {
    return generateErrorResponse('Choose a different community URL.');
  }

  const existing = await prisma.community.findUnique({ where: { slug: communitySlug }, select: { slug: true } });
  if (existing) return generateErrorResponse('That community URL is already taken.');

  await prisma.$transaction(async tx => {
    await tx.community.create({
      data: {
        slug: communitySlug,
        label: String(label ?? '').trim(),
        description: String(description ?? '').trim(),
        hashColor: String(hashColor ?? '').trim(),
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

  const { slug, label, description, hashColor, avatarUrl, coverUrl } = await request.json();

  const community = await prisma.community.findUnique({ where: { slug }, select: { createdByID: true } });
  if (!community) return generateErrorResponse('Community not found.', 404);
  if (community.createdByID !== userID) {
    return generateErrorResponse('Only the community owner can change these settings.', 403);
  }

  const updatedCommunity = await prisma.community.update({
    where: { slug },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(hashColor !== undefined ? { hashColor } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(coverUrl ? { coverUrl } : {}),
    },
  });

  revalidateCommunityPaths(slug);

  return generateSuccessResponse(updatedCommunity);
};
