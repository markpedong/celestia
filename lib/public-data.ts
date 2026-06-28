import { unstable_cache } from 'next/cache';
import { tagsPostCounts } from '@/lib/db/community.queries';
import { trendingToday } from '@/lib/trending';

export const getPublicShellData = unstable_cache(async () => {
  const tagCounts = await tagsPostCounts();
  const communities = [...tagCounts]
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));

  return { communities, tagCounts, trending: trendingToday };
}, ['public-shell'], { revalidate: 300, tags: ['public-shell'] });
