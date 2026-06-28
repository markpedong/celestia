import { prisma } from '@/lib/prisma';
import type { SearchPostSuggestion, SearchTagSuggestion } from '@/lib/types';
import { mapSearchTagSuggestionRow } from './mappers';
import { buildPostSearchWhere, tagsForPosts } from './post.queries';

export const searchSuggestions = async (searchQuery: string): Promise<{
  posts: SearchPostSuggestion[];
  tags: SearchTagSuggestion[];
}> => {
  const term = searchQuery.trim().slice(0, 80);
  if (!term) return { posts: [], tags: [] };

  const [posts, tags] = await Promise.all([
    prisma.post.findMany({
      where: buildPostSearchWhere(term),
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.community.findMany({
      where: {
        OR: [
          { slug: { contains: term.toLowerCase(), mode: 'insensitive' } },
          { label: { contains: term, mode: 'insensitive' } },
        ],
      },
      orderBy: { slug: 'asc' },
      take: 5,
    }),
  ]);

  const [tagMap, tagCounts] = await Promise.all([
    tagsForPosts(posts.map(post => post.id)),
    prisma.postTag.groupBy({
      by: ['tagSlug'],
      where: { tagSlug: { in: tags.map(tag => tag.slug) } },
      _count: { _all: true },
    }),
  ]);
  const countMap = new Map(tagCounts.map(row => [row.tagSlug, row._count._all]));

  return {
    posts: posts.map(post => ({
      id: post.id,
      title: post.title,
      body: post.body,
      tagSlugs: tagMap.get(post.id) ?? [],
    })),
    tags: tags.map(tag => mapSearchTagSuggestionRow(tag, countMap.get(tag.slug) ?? 0)),
  };
};
