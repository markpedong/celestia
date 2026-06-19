import { EnrichedCommentNode, nestCommentRows } from "../comment-tree";
import { Prisma } from "../generated/prisma/client";
import { PostModel } from "../generated/prisma/models";
import { prisma } from "../prisma";
import { Comment, FeedSort, Post, SearchPostSuggestion, SearchTagSuggestion, Tag, User, VoteTarget } from "../types";

export const batchAuthorsForIds = async (authorIds: string[]): Promise<Map<string, User>> => {
  const unique = [...new Set(authorIds)];
  if (unique.length === 0) return new Map();

  const rows = await prisma.userProfile.findMany({
    where: { id: { in: unique } },
  });

  const result = new Map<string, User>();

  for (const row of rows) {
    result.set(row.id, { id: row.id, username: row.username });
  }

  for (const id of unique) {
    if (!result.has(id)) {
      result.set(id, { id, username: `user_${id.slice(0, 6)}` });
    }
  }

  return result;
}

export type FeedPostRow = {
  post: Post
  score: number
  userVote: -1 | 0 | 1
}

const buildPostSearchWhere = (searchQuery: string): Prisma.PostWhereInput | undefined => {
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

export const listPostSorted = async (sort: FeedSort, tagFilter: string, userId: string | undefined, searchQuery = '') => {
  const filters: Prisma.PostWhereInput[] = [];
  if (tagFilter) filters.push({ postTags: { some: { tagSlug: tagFilter.toLowerCase() } } });

  const searchWhere = buildPostSearchWhere(searchQuery);
  if (searchWhere) filters.push(searchWhere);

  const where: Prisma.PostWhereInput | undefined = filters.length ? { AND: filters } : undefined;
  const postRows = await prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 })
  const ids = postRows.map((row) => row.id);

  if (ids.length === 0) return [];

  const [tagMap, ccMap, vsMap, uvMap] = await Promise.all([
    tagsForPosts(ids),
    commentCountsForPosts(ids),
    voteSumsForPosts(ids),
    userVotesForPosts(userId, ids)]
  );

  const mapped = postRows.map(row => {
    const slugs = tagMap.get(row.id) ?? [];
    const cc = ccMap.get(row.id) ?? 0;
    const vs = vsMap.get(row.id) ?? 0;

    return {
      post: mapPostRow(row, slugs, cc),
      voteScore: vs,
      created: row.createdAt.getTime(),
      tagSlugs: slugs,
      userVote: uvMap.get(row.id) ?? 0,
    }
  })

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
}

const commentCountsForPosts = async (postIds: string[]): Promise<Map<string, number>> => {
  if (postIds.length === 0) return new Map();
  const rows = await prisma.comment.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds } },
    _count: { _all: true },
  });
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.postId, r._count._all);
  }
  return m;
}

async function userVotesForPosts(
  userId: string | undefined,
  postIds: string[],
): Promise<Map<string, -1 | 0 | 1>> {
  const m = new Map<string, -1 | 0 | 1>();
  if (!userId || postIds.length === 0) return m;
  const rows = await prisma.vote.findMany({
    where: {
      userId,
      targetType: "post",
      targetId: { in: postIds },
    },
  });
  for (const r of rows) {
    const v = r.value;
    m.set(r.targetId, v === -1 || v === 1 ? v : 0);
  }
  return m;
}

export const listTags = async (): Promise<Tag[]> => {
  const rows = await prisma.tag.findMany({ orderBy: { slug: "asc" } });
  return rows.map((t) => ({
    slug: t.slug,
    label: t.label,
    hashColor: t.hashColor,
  }));
}

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
    prisma.tag.findMany({
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
    tags: tags.map(tag => ({
      slug: tag.slug,
      label: tag.label,
      hashColor: tag.hashColor,
      postCount: countMap.get(tag.slug) ?? 0,
    })),
  };
};

const tagsForPosts = async (postIds: string[]): Promise<Map<string, string[]>> => {
  const m = new Map<string, string[]>();
  if (postIds.length === 0) return m;

  const rows = await prisma.postTag.findMany({
    where: { postId: { in: postIds } },
  });

  for (const pid of postIds) m.set(pid, []); // nagawa ng empty m ap from parameter postids
  for (const r of rows) {
    const list = m.get(r.postId) ?? []; // kinukuha niya yung naunang gawa na map from parameter postids
    list.push(r.tagSlug);
    m.set(r.postId, list);
  }

  return m;
}

const voteSumsForPosts = async (postIds: string[]): Promise<Map<string, number>> => {
  if (postIds.length === 0) return new Map();
  const rows = await prisma.vote.groupBy({
    by: ["targetId"],
    where: {
      targetType: "post",
      targetId: { in: postIds },
    },
    _sum: { value: true },
  });
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.targetId, Number(r._sum.value ?? 0));
  }
  return m;
}

const mapPostRow = (row: PostModel, tagSlugs: string[], commentCount: number): Post => {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    body: row.body,
    tagSlugs,
    createdAt: row.createdAt.toISOString(),
    commentCount,
  };
}

export const getUserVote = async (userId: string | undefined, type: VoteTarget, targetId: string): Promise<-1 | 0 | 1> => {
  if (!userId) return 0;

  const row = await prisma.vote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: type,
        targetId,
      },
    },
  });

  const v = row?.value;

  return v === -1 || v === 1 ? v : 0;
}

export const getPostByID = async (id: string): Promise<Post | undefined> => {
  const row = await prisma.post.findUnique({ where: { id } });
  if (!row) return undefined;

  const [tagMap, ccMap] = await Promise.all([
    tagsForPosts([id]),
    commentCountsForPosts([id]),
  ]);

  return mapPostRow(row, tagMap.get(id) ?? [], ccMap.get(id) ?? 0);

}

export const getAuthorByID = async (authorID: string): Promise<User> => {
  const row = await prisma.userProfile.findUnique({ where: { id: authorID } });
  return row
    ? { id: row.id, username: row.username }
    : { id: authorID, username: `user_${authorID.slice(0, 6)}` };
}

export const getPostScore = async (postId: string): Promise<number> => {
  const agg = await prisma.vote.aggregate({
    where: { targetType: "post", targetId: postId },
    _sum: { value: true },
  });
  return Number(agg._sum.value ?? 0);
}

export const getCommentTree = async (postID: string, sessionID?: string): Promise<EnrichedCommentNode[]> => {
  const flat = await listCommentsForPost(postID)
  if (flat.length === 0) return []

  const authorIDs = [...new Set(flat.map(c => c.authorId))]
  const authorMap = await batchAuthorsForIds(authorIDs)

  const commentIDs = flat.map(c => c.id)
  const scoreMap = await batchCommentScores(commentIDs);
  const voteMap = sessionID ? await batchUserVotesForComments(sessionID, commentIDs) : new Map<string, -1 | 0 | 1>();

  const enriched = flat.map(c => {
    const author = authorMap.get(c.authorId)
    if (!author) return null;

    return {
      ...c,
      author,
      score: scoreMap.get(c.id) ?? 0,
      userVote: voteMap.get(c.id) ?? 0,
    }
  }).filter((c): c is NonNullable<typeof c> => c !== null);

  return nestCommentRows(enriched);
}

export const batchUserVotesForComments = async (userID: string, commentIDs: string[]): Promise<Map<string, -1 | 0 | 1>> => {
  if (commentIDs.length === 0) return new Map();
  const rows = await prisma.vote.findMany({
    where: {
      userId: userID,
      targetType: "comment",
      targetId: { in: commentIDs },
    },
  });
  const m = new Map<string, -1 | 0 | 1>();
  for (const r of rows) {
    m.set(r.targetId, r.value === -1 || r.value === 1 ? r.value : 0);
  }
  return m;
}

export const batchCommentScores = async (commentIDs: string[]): Promise<Map<string, number>> => {
  if (commentIDs.length === 0) return new Map();

  const rows = await prisma.vote.groupBy({
    by: ["targetId"],
    where: {
      targetType: "comment",
      targetId: { in: commentIDs }
    },
    _sum: { value: true }
  })

  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.targetId, Number(r._sum.value ?? 0));
  }

  return m
}

export const listCommentsForPost = async (postID: string): Promise<Comment[]> => {
  const rows = await prisma.comment.findMany({ where: { postId: postID } });

  return rows.map(c => ({
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    parentId: c.parentId,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  }))
}

export const tagsPostCounts = async (): Promise<{ tag: Tag, count: number }[]> => {
  const allTags = await listTags();
  const rows = await prisma.postTag.groupBy({
    by: ["tagSlug"],
    _count: { _all: true },
  })

  const countMap = new Map(rows.map(r => [r.tagSlug, r._count._all]))
  return allTags.map(tag => ({
    tag,
    count: countMap.get(tag.slug) ?? 0
  }))
}
