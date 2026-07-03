import type { ApiResponse, FeedSort } from '@/lib/types';
import { getRedis } from './redis';

const FEED_VERSION_KEY = 'feed:version';

export const feedCacheTTL = (sort: FeedSort) => sort === 'new' ? 20 : sort === 'hot' || sort === 'top' ? 60 : 30;

export const feedCacheVersion = async () => {
  const redis = getRedis();
  if (!redis) return '0';

  try {
    return String((await redis.get<string | number>(FEED_VERSION_KEY)) ?? 0);
  } catch (error) {
    console.error('Redis feed cache version failed:', error);
    return '0';
  }
};

export const feedCacheKey = (scope: string, parts: Record<string, string | number | null | undefined>) =>
  [
    'feed',
    scope,
    ...Object.entries(parts).map(([key, value]) => `${key}=${encodeURIComponent(String(value ?? 'null'))}`),
  ].join(':');

export const getFeedCache = async <T>(key: string): Promise<ApiResponse<T> | null> => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<ApiResponse<T>>(key);
  } catch (error) {
    console.error('Redis feed cache get failed:', error);
    return null;
  }
};

export const setFeedCache = async <T>(key: string, payload: ApiResponse<T>, ttlSeconds: number) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, payload, { ex: ttlSeconds });
  } catch (error) {
    console.error('Redis feed cache set failed:', error);
  }
};

export const invalidateFeedCache = async () => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.incr(FEED_VERSION_KEY);
  } catch (error) {
    console.error('Redis feed cache invalidation failed:', error);
  }
};
