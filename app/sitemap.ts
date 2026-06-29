import type { MetadataRoute } from 'next';
import { listCommunity } from '@/lib/db/community.queries';
import { listPostIDs } from '@/lib/db/post.queries';
import { listUserNames } from '@/lib/db/user.queries';
import { siteUrl } from '@/lib/seo';

const staticRoutes = ['', '/explore', '/posts', '/top'];

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const [communities, postIDs, usernames] = await Promise.all([listCommunity(), listPostIDs(), listUserNames()]);
  const now = new Date();

  return [
    ...staticRoutes.map(path => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...communities.map(community => ({
      url: `${siteUrl}/r/${encodeURIComponent(community.slug)}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...postIDs.map(id => ({
      url: `${siteUrl}/post/${encodeURIComponent(id)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...usernames.map(username => ({
      url: `${siteUrl}/u/${encodeURIComponent(username)}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];
};

export default sitemap;
