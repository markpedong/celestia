import { getSessionUser } from '@/lib/auth';
import { getCommunityFeedData } from '@/lib/db/community.queries';
import { prisma } from '@/lib/prisma';
import { feedCacheKey, feedCacheTTL, feedCacheVersion, getFeedCache, setFeedCache } from '@/lib/server/feed-cache';
import type { ApiResponse, CommunityFeed, FeedSort } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const isFeedSort = (value: unknown): value is FeedSort => value === 'hot' || value === 'new' || value === 'top';

const respondWithFeed = async (slug: unknown, sort: unknown, cache = false) => {
  const communitySlug = String(slug ?? '').trim().toLowerCase();
  const feedSort = isFeedSort(sort) ? sort : 'hot';

  const community = await prisma.community.findFirst({ where: { slug: communitySlug } });
  if (!community) return generateErrorResponse('Community not found.', 404);

  const sessionUser = await getSessionUser();
  if (cache) {
    const version = await feedCacheVersion();
    const cacheKey = feedCacheKey('community', { slug: community.slug, sort: feedSort, viewer: sessionUser?.id ?? 'anon', limit: 50, v: version });
    const cached = await getFeedCache<CommunityFeed>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const feed = await getCommunityFeedData(community.slug, feedSort, sessionUser?.id);
    const payload: ApiResponse<CommunityFeed> = { success: true, data: feed, message: 'Data fetched successfully' };
    await setFeedCache(cacheKey, payload, feedCacheTTL(feedSort));
    return NextResponse.json(payload);
  }

  const feed = await getCommunityFeedData(community.slug, feedSort, sessionUser?.id);

  return generateSuccessResponse(feed);
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  return respondWithFeed(searchParams.get('slug'), searchParams.get('sort'), true);
};

export const POST = async (request: Request) => {
  const { slug, sort } = await request.json();
  return respondWithFeed(slug, sort);
};
