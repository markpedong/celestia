import { nestCommentRows } from "../comment-tree";
import { cache } from "react";
import { Prisma } from "../generated/prisma/client";
import { PostModel } from "../generated/prisma/models";
import { prisma } from "../prisma";
import type { Comment, Community, CommunityStats, EnrichedCommentNode, FeedPostRow, FeedSort, Post, SearchPostSuggestion, SearchTagSuggestion, Tag, TagPostCount, User, UserCommentActivity, UserStats, VoteTarget } from "../types";

const fallbackUsernameForId = (id: string) => {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 28) || `user_${id.slice(0, 6)}`;
}

const fallbackUserForId = (id: string): User => ({
  id,
  username: fallbackUsernameForId(id),
});

const mapUserProfile = (row: {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: Date;
}): User => ({
  id: row.id,
  username: row.username,
  displayName: row.displayName ?? undefined,
  bio: row.bio ?? undefined,
  avatarUrl: row.avatarUrl ?? undefined,
  coverUrl: row.coverUrl ?? undefined,
  createdAt: row.createdAt.toISOString(),
});

export const batchAuthorsForIds = async (authorIds: string[]): Promise<Map<string, User>> => {
  const unique = [...new Set(authorIds)];
  if (unique.length === 0) return new Map();

  const rows = await prisma.userProfile.findMany({
    where: { id: { in: unique } },
  });

  const result = new Map<string, User>();

  for (const row of rows) {
    result.set(row.id, mapUserProfile(row));
  }

  for (const id of unique) {
    if (!result.has(id)) {
      result.set(id, fallbackUserForId(id));
    }
  }

  return result;
}

export const batchUserStatsForIds = async (userIds: string[]): Promise<Map<string, UserStats>> => {
  const unique = [...new Set(userIds)];
  const result = new Map(unique.map(id => [id, { postCount: 0, commentCount: 0, karma: 0, commentKarma: 0 }]));
  if (unique.length === 0) return result;

  const [posts, comments] = await Promise.all([
    prisma.post.findMany({ where: { authorId: { in: unique } }, select: { id: true, authorId: true } }),
    prisma.comment.findMany({ where: { authorId: { in: unique } }, select: { id: true, authorId: true } }),
  ]);
  const postIds = posts.map(post => post.id);
  const commentIds = comments.map(comment => comment.id);
  const voteSums = postIds.length || commentIds.length
    ? await prisma.vote.groupBy({
        by: ['targetType', 'targetId'],
        where: {
          OR: [
            ...(postIds.length ? [{ targetType: 'post', targetId: { in: postIds } }] : []),
            ...(commentIds.length ? [{ targetType: 'comment', targetId: { in: commentIds } }] : []),
          ],
        },
        _sum: { value: true },
      })
    : [];
  const postAuthorById = new Map(posts.map(post => [post.id, post.authorId]));
  const commentAuthorById = new Map(comments.map(comment => [comment.id, comment.authorId]));

  for (const post of posts) {
    const stats = result.get(post.authorId)!;
    stats.postCount += 1;
  }
  for (const comment of comments) {
    result.get(comment.authorId)!.commentCount += 1;
  }
  for (const row of voteSums) {
    const authorId = row.targetType === 'post' ? postAuthorById.get(row.targetId) : commentAuthorById.get(row.targetId);
    if (authorId) result.get(authorId)![row.targetType === 'post' ? 'karma' : 'commentKarma'] += Number(row._sum.value ?? 0);
  }

  return result;
};

const listEnrichedPosts = async (
  sort: FeedSort,
  where: Prisma.PostWhereInput | undefined,
  userId: string | undefined,
): Promise<FeedPostRow[]> => {
  const postRows = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      postTags: { select: { tagSlug: true } },
      _count: { select: { comments: true } },
    },
  });
  const ids = postRows.map((row) => row.id);

  if (ids.length === 0) return [];

  const [vsMap, uvMap] = await Promise.all([
    voteSumsForPosts(ids),
    userVotesForPosts(userId, ids),
  ]);

  const mapped = postRows.map(row => {
    const slugs = row.postTags.map(({ tagSlug }) => tagSlug);
    const cc = row._count.comments;
    const vs = vsMap.get(row.id) ?? 0;

    return {
      post: mapPostRow(row, slugs, cc),
      voteScore: vs,
      created: row.createdAt.getTime(),
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
};

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
  return listEnrichedPosts(sort, where, userId);
}

export const listPostsByAuthor = async (authorId: string, sort: FeedSort, userId: string | undefined): Promise<FeedPostRow[]> => {
  return listEnrichedPosts(sort, { authorId }, userId);
}

const listVotedTargetIds = async (userId: string, targetType: VoteTarget, value: -1 | 1): Promise<string[]> => {
  const votes = await prisma.vote.findMany({
    where: { userId, targetType, value },
    select: { targetId: true },
  });
  return votes.map(vote => vote.targetId);
};

export const listVotedPostsByUser = async (
  userId: string,
  value: -1 | 1,
  viewerId: string | undefined,
): Promise<FeedPostRow[]> => {
  const postIds = await listVotedTargetIds(userId, 'post', value);
  return postIds.length ? listEnrichedPosts('new', { id: { in: postIds } }, viewerId) : [];
};

const userVotesForPosts = async (
  userId: string | undefined,
  postIds: string[],
): Promise<Map<string, -1 | 0 | 1>> => {
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
};

export const listTags = cache(async (): Promise<Tag[]> => {
  const rows = await prisma.tag.findMany({ orderBy: { slug: "asc" } });
  return rows.map((t) => ({
    slug: t.slug,
    label: t.label,
    hashColor: t.hashColor,
  }));
});

export const getTagBySlug = cache(async (slug: string): Promise<Community | undefined> => {
  const row = await prisma.tag.findUnique({ where: { slug: slug.toLowerCase() } });
  return row ? {
    slug: row.slug,
    label: row.label,
    description: row.description,
    hashColor: row.hashColor,
    createdById: row.createdById ?? undefined,
    createdAt: row.createdAt.toISOString(),
  } : undefined;
});

export const getCommunityStats = async (slug: string): Promise<CommunityStats> => {
  const tagSlug = slug.toLowerCase();
  const [postCount, memberCount, commentRows] = await Promise.all([
    prisma.postTag.count({ where: { tagSlug } }),
    prisma.communityMembership.count({ where: { communitySlug: tagSlug } }),
    prisma.comment.count({
      where: { post: { postTags: { some: { tagSlug } } } },
    }),
  ]);

  return {
    postCount,
    memberCount,
    commentCount: commentRows,
  };
}

export const getCommunityMembership = async (userId: string | undefined, slug: string): Promise<boolean> => {
  if (!userId) return false;

  const membership = await prisma.communityMembership.findUnique({
    where: { userId_communitySlug: { userId, communitySlug: slug.toLowerCase() } },
    select: { userId: true },
  });

  return Boolean(membership);
};

export const listJoinedCommunities = async (userId: string): Promise<Community[]> => {
  const memberships = await prisma.communityMembership.findMany({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    include: { community: true },
  });

  return memberships.map(({ community }) => ({
    slug: community.slug,
    label: community.label,
    description: community.description,
    hashColor: community.hashColor,
    createdById: community.createdById ?? undefined,
    createdAt: community.createdAt.toISOString(),
  }));
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
    imageUrls: row.imageUrls,
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
  const row = await prisma.post.findUnique({
    where: { id },
    include: {
      postTags: { select: { tagSlug: true } },
      _count: { select: { comments: true } },
    },
  });
  if (!row) return undefined;

  return mapPostRow(row, row.postTags.map(({ tagSlug }) => tagSlug), row._count.comments);

}

export const listPostIds = cache(async () => {
  const posts = await prisma.post.findMany({ select: { id: true } });
  return posts.map(post => post.id);
});

export const listUsernames = cache(async () => {
  const profiles = await prisma.userProfile.findMany({ select: { username: true } });
  return profiles.map(profile => profile.username);
});

export const getAuthorByID = async (authorID: string): Promise<User> => {
  const row = await prisma.userProfile.findUnique({ where: { id: authorID } });
  return row ? mapUserProfile(row) : fallbackUserForId(authorID);
}

export const getProfileSettingsByUserId = cache(async (userId: string) => prisma.userProfile.findUnique({
  where: { id: userId },
  select: { username: true, displayName: true, bio: true, avatarUrl: true, coverUrl: true },
}));

export const getUserByUsername = cache(async (username: string): Promise<User | undefined> => {
  const row = await prisma.userProfile.findUnique({ where: { username } });
  if (row) return mapUserProfile(row);

  const [postAuthors, commentAuthors] = await Promise.all([
    prisma.post.findMany({ distinct: ['authorId'], select: { authorId: true } }),
    prisma.comment.findMany({ distinct: ['authorId'], select: { authorId: true } }),
  ]);
  const authorIds = [...new Set([...postAuthors, ...commentAuthors].map(author => author.authorId))];
  const fallbackId = authorIds.find(authorId => fallbackUsernameForId(authorId) === username);

  return fallbackId ? fallbackUserForId(fallbackId) : undefined;
});

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    select: { id: true },
  });
  const postIds = posts.map(post => post.id);
  const comments = await prisma.comment.findMany({ where: { authorId: userId }, select: { id: true } });
  const targetIds = [...postIds, ...comments.map(comment => comment.id)];
  const voteRows = targetIds.length
    ? await prisma.vote.groupBy({
      by: ['targetType', 'targetId'],
      where: {
        OR: [
          ...(postIds.length ? [{ targetType: 'post', targetId: { in: postIds } }] : []),
          ...(comments.length ? [{ targetType: 'comment', targetId: { in: comments.map(comment => comment.id) } }] : []),
        ],
      },
      _sum: { value: true },
    })
    : [];

  return {
    postCount: posts.length,
    commentCount: comments.length,
    karma: voteRows.filter(row => row.targetType === 'post').reduce((total, row) => total + Number(row._sum.value ?? 0), 0),
    commentKarma: voteRows.filter(row => row.targetType === 'comment').reduce((total, row) => total + Number(row._sum.value ?? 0), 0),
  };
}

const listComments = async (where: Prisma.CommentWhereInput): Promise<UserCommentActivity[]> => {
  const rows = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: { post: { select: { title: true } } },
  });

  return rows.map(row => ({
    id: row.id,
    postId: row.postId,
    postTitle: row.post.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const listCommentsByAuthor = async (authorId: string): Promise<UserCommentActivity[]> => listComments({ authorId });

export const listVotedCommentsByUser = async (userId: string, value: -1 | 1): Promise<UserCommentActivity[]> => {
  const commentIds = await listVotedTargetIds(userId, 'comment', value);
  return commentIds.length ? listComments({ id: { in: commentIds } }) : [];
};

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
  const commentIDs = flat.map(c => c.id)
  const [authorMap, scoreMap, voteMap] = await Promise.all([
    batchAuthorsForIds(authorIDs),
    batchCommentScores(commentIDs),
    sessionID ? batchUserVotesForComments(sessionID, commentIDs) : Promise.resolve(new Map<string, -1 | 0 | 1>()),
  ]);

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

export const tagsPostCounts = cache(async (): Promise<TagPostCount[]> => {
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
});
