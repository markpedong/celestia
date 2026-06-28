import { getSessionUser } from '@/lib/auth';
import { getCommunityFeedData } from '@/lib/db/community.queries';
import { prisma } from '@/lib/prisma';
import type { FeedSort } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const dynamic = 'force-dynamic';

const isFeedSort = (value: unknown): value is FeedSort => value === 'hot' || value === 'new' || value === 'top';

const respondWithFeed = async (slug: unknown, sort: unknown) => {
  const communitySlug = String(slug ?? '').trim().toLowerCase();
  const feedSort = isFeedSort(sort) ? sort : 'hot';

  const community = await prisma.community.findFirst({ where: { slug: communitySlug } });
  if (!community) return generateErrorResponse('Community not found.', 404);

  const sessionUser = await getSessionUser();
  const feed = await getCommunityFeedData(community.slug, feedSort, sessionUser?.id);

  return generateSuccessResponse(feed);
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  return respondWithFeed(searchParams.get('slug'), searchParams.get('sort'));
};

export const POST = async (request: Request) => {
  const { slug, sort } = await request.json();
  return respondWithFeed(slug, sort);
};
