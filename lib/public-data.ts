import { unstable_cache } from 'next/cache';
import { API_ENDPOINT } from '@/constants/enums';
import { trendingToday } from '@/lib/trending';
import type { ApiResponse, TagPostCount } from '@/lib/types';

export const getPublicShellData = unstable_cache(async () => {
  const response = await fetch(`${process.env.DOMAIN}/api${API_ENDPOINT.COMMUNITY_COUNTS}`, { next: { revalidate: 300 } });
  const payload = await response.json() as ApiResponse<TagPostCount[]>;
  const tagCounts = payload.data ?? [];
  const communities = [...tagCounts]
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));

  return { communities, tagCounts, trending: trendingToday };
}, ['public-shell'], { revalidate: 300, tags: ['public-shell'] });
