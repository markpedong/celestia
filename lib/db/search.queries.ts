import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import type {
  SearchPostSuggestion,
  SearchResultComment,
  SearchResultPost,
  SearchResults,
  SearchResultType,
  SearchResultUser,
  SearchTagSuggestion,
} from '@/lib/types';
import { mapCommunityRow, mapSearchTagSuggestionRow } from './mappers';
import { buildPostSearchWhere, tagsForPosts } from './post.queries';

const PAGE_SIZE = 20;

const mapSearchUser = (user: {
  id: string;
  userName: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}): SearchResultUser => user;

const usersByID = async (ids: string[]) => {
  if (!ids.length) return new Map<string, SearchResultUser>();

  const users = await prisma.users.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, userName: true, displayName: true, bio: true, avatarUrl: true },
  });
  return new Map(users.map(user => [user.id, mapSearchUser(user)]));
};

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

export const searchAll = async (
  searchQuery: string,
  options: { type?: SearchResultType; community?: string; page?: number } = {},
): Promise<SearchResults> => {
  const term = searchQuery.trim().slice(0, 80);
  const type = options.type ?? 'posts';
  const community = options.community?.trim().toLowerCase().slice(0, 64) || '';
  const page = Math.max(1, Math.min(1000, Math.floor(options.page ?? 1)));
  const skip = (page - 1) * PAGE_SIZE;
  const empty = {
    type,
    total: 0,
    page,
    pageSize: PAGE_SIZE,
    posts: [],
    comments: [],
    communities: [],
    people: [],
  } satisfies SearchResults;

  if (!term) return empty;

  if (type === 'posts') {
    const filters: Prisma.PostWhereInput[] = [];
    const searchWhere = buildPostSearchWhere(term);
    if (searchWhere) filters.push(searchWhere);
    if (community) filters.push({ postTags: { some: { tagSlug: community } } });
    const where: Prisma.PostWhereInput = { AND: filters };
    const [total, rows] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: { postTags: true, _count: { select: { comments: true } } },
      }),
    ]);
    const authorMap = await usersByID(rows.map(row => row.authorID));
    const posts: SearchResultPost[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      commentCount: row._count.comments,
      tagSlugs: row.postTags.map(tag => tag.tagSlug),
      author: authorMap.get(row.authorID) ?? null,
    }));
    return { ...empty, total, posts };
  }

  if (type === 'comments') {
    const where = {
      deletedAt: null,
      body: { contains: term, mode: 'insensitive' as const },
      ...(community ? { post: { postTags: { some: { tagSlug: community } } } } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: { post: { select: { title: true } } },
      }),
    ]);
    const authorMap = await usersByID(rows.map(row => row.authorID));
    const comments: SearchResultComment[] = rows.map(row => ({
      id: row.id,
      postID: row.postID,
      postTitle: row.post.title,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      author: authorMap.get(row.authorID) ?? null,
    }));
    return { ...empty, total, comments };
  }

  if (type === 'communities') {
    const where = {
      OR: [
        { slug: { contains: term.toLowerCase(), mode: 'insensitive' as const } },
        { label: { contains: term, mode: 'insensitive' as const } },
        { description: { contains: term, mode: 'insensitive' as const } },
      ],
    };
    const [total, rows] = await Promise.all([
      prisma.community.count({ where }),
      prisma.community.findMany({
        where,
        orderBy: { slug: 'asc' },
        skip,
        take: PAGE_SIZE,
        include: { _count: { select: { postTags: true, memberships: true } } },
      }),
    ]);
    return {
      ...empty,
      total,
      communities: rows.map(row => ({
        ...mapCommunityRow(row),
        postCount: row._count.postTags,
        memberCount: row._count.memberships,
      })),
    };
  }

  const where = {
    OR: [
      { userName: { contains: term, mode: 'insensitive' as const } },
      { displayName: { contains: term, mode: 'insensitive' as const } },
      { bio: { contains: term, mode: 'insensitive' as const } },
    ],
  };
  const [total, people] = await Promise.all([
    prisma.users.count({ where }),
    prisma.users.findMany({
      where,
      orderBy: { userName: 'asc' },
      skip,
      take: PAGE_SIZE,
      select: { id: true, userName: true, displayName: true, bio: true, avatarUrl: true },
    }),
  ]);
  return { ...empty, total, people: people.map(mapSearchUser) };
};
