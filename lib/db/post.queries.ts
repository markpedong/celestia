import { cache } from 'react';
import uniq from 'lodash/uniq';
import { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { FeedPostRow, FeedSort, FeedTimeRange } from '@/lib/types';
import { mapPostRow } from './mappers';
import { listVotedTargetIDs, userVotesForTargets, voteSumsForTargets } from './vote.queries';

const listEnrichedPosts = async (
  sort: FeedSort,
  filters: { tag?: string; authorID?: string; search?: string; ids?: string[]; includeFiltered?: boolean; timeRange?: FeedTimeRange },
  userID: string | undefined,
): Promise<FeedPostRow[]> => {
  const conditions: Prisma.Sql[] = [];
  if (filters.tag) conditions.push(Prisma.sql`EXISTS (
    SELECT 1 FROM post_tags AS filtered_tag
    WHERE filtered_tag.post_id = post.id AND filtered_tag.tag_slug = ${filters.tag}
  )`);
  if (filters.authorID) conditions.push(Prisma.sql`post.author_id = ${filters.authorID}`);
  if (filters.ids) conditions.push(Prisma.sql`post.id IN (${Prisma.join(filters.ids.map(id => Prisma.sql`${id}::uuid`))})`);
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(Prisma.sql`(
      post.title ILIKE ${pattern}
      OR post.body ILIKE ${pattern}
      OR EXISTS (
        SELECT 1
        FROM post_tags AS searched_tag
        JOIN community ON community.slug = searched_tag.tag_slug
        WHERE searched_tag.post_id = post.id
          AND (searched_tag.tag_slug ILIKE ${pattern} OR community.label ILIKE ${pattern})
      )
    )`);
  }
  if (sort === 'rising') conditions.push(Prisma.sql`post.created_at >= NOW() - INTERVAL '72 hours'`);
  const timeRange = filters.timeRange ?? 'all';
  if (timeRange !== 'all' && (sort === 'top' || sort === 'controversial')) {
    const interval = timeRange === 'hour'
      ? Prisma.sql`INTERVAL '1 hour'`
      : timeRange === 'day'
        ? Prisma.sql`INTERVAL '1 day'`
        : timeRange === 'week'
          ? Prisma.sql`INTERVAL '7 days'`
          : timeRange === 'month'
            ? Prisma.sql`INTERVAL '30 days'`
            : Prisma.sql`INTERVAL '1 year'`;
    conditions.push(Prisma.sql`post.created_at >= NOW() - ${interval}`);
  }
  if (userID && !filters.includeFiltered) {
    conditions.push(Prisma.sql`NOT EXISTS (
      SELECT 1 FROM content_actions AS hidden_action
      WHERE hidden_action.user_id = ${userID}
        AND hidden_action.kind = 'hidden'
        AND hidden_action.target_type = 'post'
        AND hidden_action.target_id = post.id::text
    )`);
    if (!filters.tag) {
      conditions.push(Prisma.sql`NOT EXISTS (
        SELECT 1
        FROM post_tags AS muted_tag
        JOIN content_actions AS muted_action
          ON muted_action.user_id = ${userID}
          AND muted_action.kind = 'muted'
          AND muted_action.target_type = 'community'
          AND muted_action.target_id = muted_tag.tag_slug
        WHERE muted_tag.post_id = post.id
      )`);
    }
  }

  const whereClause = conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;
  const orderBy = sort === 'new'
    ? Prisma.sql`post.created_at DESC`
    : sort === 'top'
      ? Prisma.sql`COALESCE(vote_stats.score, 0) DESC, COALESCE(comment_stats.comment_count, 0) DESC, post.created_at DESC`
      : sort === 'controversial'
        ? Prisma.sql`(
            LEAST(COALESCE(vote_stats.upvotes, 0), COALESCE(vote_stats.downvotes, 0))
            * (COALESCE(vote_stats.upvotes, 0) + COALESCE(vote_stats.downvotes, 0))
            / GREATEST(ABS(COALESCE(vote_stats.score, 0)), 1)
          ) DESC, post.created_at DESC`
        : sort === 'rising'
          ? Prisma.sql`(
              GREATEST(COALESCE(vote_stats.score, 0), 0) + COALESCE(comment_stats.comment_count, 0) + 1
            ) / POWER(GREATEST(EXTRACT(EPOCH FROM (NOW() - post.created_at)) / 3600, 0) + 2, 1.8) DESC`
          : Prisma.sql`(
              COALESCE(vote_stats.score, 0) + 2 * COALESCE(comment_stats.comment_count, 0) + 1
            ) / POWER(GREATEST(EXTRACT(EPOCH FROM (NOW() - post.created_at)) / 3600, 0) + 2, 1.5) DESC`;

  const ranked = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    WITH vote_stats AS (
      SELECT
        target_id,
        COALESCE(SUM(value), 0) AS score,
        COUNT(*) FILTER (WHERE value = 1) AS upvotes,
        COUNT(*) FILTER (WHERE value = -1) AS downvotes
      FROM votes
      WHERE target_type = 'post'
      GROUP BY target_id
    ),
    comment_stats AS (
      SELECT post_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY post_id
    )
    SELECT post.id
    FROM posts AS post
    LEFT JOIN vote_stats ON vote_stats.target_id = post.id
    LEFT JOIN comment_stats ON comment_stats.post_id = post.id
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 50
  `);
  const rankedIDs = ranked.map(row => row.id);
  if (rankedIDs.length === 0) return [];

  const postRows = await prisma.post.findMany({
    where: { id: { in: rankedIDs } },
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
      userVote: voteMap.get(row.id) ?? 0,
    };
  });
  const position = new Map(rankedIDs.map((id, index) => [id, index]));
  mapped.sort((left, right) => (position.get(left.post.id) ?? 0) - (position.get(right.post.id) ?? 0));

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
  timeRange: FeedTimeRange = 'all',
) => {
  return listEnrichedPosts(sort, {
    tag: tagFilter ? tagFilter.toLowerCase() : undefined,
    search: searchQuery.trim() || undefined,
    timeRange,
  }, userID);
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
  return postIDs.length ? listEnrichedPosts('new', { ids: postIDs }, viewerID) : [];
};

export const listPostsByIDs = async (
  postIDs: string[],
  viewerID: string | undefined,
): Promise<FeedPostRow[]> => postIDs.length
  ? listEnrichedPosts('new', { ids: postIDs, includeFiltered: true }, viewerID)
  : [];

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
