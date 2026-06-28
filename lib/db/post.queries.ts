import { cache } from 'react';
import uniq from 'lodash/uniq';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { FeedPostRow, FeedSort } from '@/lib/types';
import { mapPostRow } from './mappers';
import { listVotedTargetIDs, userVotesForTargets, voteSumsForTargets } from './vote.queries';

const listEnrichedPosts = async (
  sort: FeedSort,
  where: Prisma.PostWhereInput | undefined,
  userID: string | undefined,
): Promise<FeedPostRow[]> => {
  const postRows = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      postTags: { select: { tagSlug: true } },
      _count: { select: { comments: true } },
    },
  });
  const ids = postRows.map(row => row.id);
  if (ids.length === 0) return [];

  const [scoreMap, voteMap] = await Promise.all([
    voteSumsForTargets('post', ids),
    userVotesForTargets(userID, 'post', ids),
  ]);

  const mapped = postRows.map(row => {
    const voteScore = scoreMap.get(row.id) ?? 0;
    return {
      post: mapPostRow(row, row.postTags.map(({ tagSlug }) => tagSlug), row._count.comments),
      voteScore,
      created: row.createdAt.getTime(),
      userVote: voteMap.get(row.id) ?? 0,
    };
  });

  if (sort === 'new') {
    mapped.sort((a, b) => b.created - a.created);
  } else if (sort === 'top') {
    mapped.sort((a, b) => b.voteScore - a.voteScore || b.post.commentCount - a.post.commentCount || b.created - a.created);
  } else {
    mapped.sort((a, b) => {
      const hotB = b.voteScore + 2 * b.post.commentCount;
      const hotA = a.voteScore + 2 * a.post.commentCount;
      return hotB - hotA || b.created - a.created;
    });
  }

  return mapped.map(row => ({ post: row.post, score: row.voteScore, userVote: row.userVote }));
};

export const buildPostSearchWhere = (searchQuery: string): Prisma.PostWhereInput | undefined => {
  const term = searchQuery.trim();
  if (!term) return undefined;

  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      { body: { contains: term, mode: 'insensitive' } },
      {
        postTags: {
          some: {
            OR: [
              { tagSlug: { contains: term.toLowerCase(), mode: 'insensitive' } },
              { tag: { label: { contains: term, mode: 'insensitive' } } },
            ],
          },
        },
      },
    ],
  };
};

export const listPostSorted = async (
  sort: FeedSort,
  tagFilter: string,
  userID: string | undefined,
  searchQuery = '',
) => {
  const filters: Prisma.PostWhereInput[] = [];
  if (tagFilter) filters.push({ postTags: { some: { tagSlug: tagFilter.toLowerCase() } } });

  const searchWhere = buildPostSearchWhere(searchQuery);
  if (searchWhere) filters.push(searchWhere);

  const where: Prisma.PostWhereInput | undefined = filters.length ? { AND: filters } : undefined;
  return listEnrichedPosts(sort, where, userID);
};

export const listPostsByAuthor = async (
  authorID: string,
  sort: FeedSort,
  userID: string | undefined,
): Promise<FeedPostRow[]> => {
  return listEnrichedPosts(sort, { authorID }, userID);
};

export const listVotedPostsByUser = async (
  userID: string,
  value: -1 | 1,
  viewerID: string | undefined,
): Promise<FeedPostRow[]> => {
  const postIDs = await listVotedTargetIDs(userID, 'post', value);
  return postIDs.length ? listEnrichedPosts('new', { id: { in: postIDs } }, viewerID) : [];
};

export const tagsForPosts = async (postIDs: string[]): Promise<Map<string, string[]>> => {
  const tags = new Map<string, string[]>();
  if (postIDs.length === 0) return tags;

  const rows = await prisma.postTag.findMany({ where: { postID: { in: postIDs } } });
  for (const postID of postIDs) tags.set(postID, []);
  for (const row of rows) {
    const list = tags.get(row.postID) ?? [];
    list.push(row.tagSlug);
    tags.set(row.postID, list);
  }

  return tags;
};

export const getPostByID = async (id: string) => {
  const row = await prisma.post.findUnique({
    where: { id },
    include: {
      postTags: { select: { tagSlug: true } },
      _count: { select: { comments: true } },
    },
  });
  if (!row) return undefined;

  return mapPostRow(row, row.postTags.map(({ tagSlug }) => tagSlug), row._count.comments);
};

export const listPostIDs = cache(async () => {
  const posts = await prisma.post.findMany({ select: { id: true } });
  return posts.map(post => post.id);
});

export const authorIDsForFeedRows = (rows: FeedPostRow[]) => uniq(rows.map(({ post }) => post.authorID));
