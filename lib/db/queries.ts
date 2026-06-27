import { nestCommentRows } from "../comment-tree";
import { cache } from "react";
import { Prisma } from "../generated/prisma/client";
import { PostModel } from "../generated/prisma/models";
import { prisma } from "../prisma";
import type { Comment, Community, CommunityFeed, CommunityMember, CommunityStats, EnrichedCommentNode, FeedPostRow, FeedSort, Post, SearchPostSuggestion, SearchTagSuggestion, Tag, TagPostCount, User, UserCommentActivity, UserStats, VoteTarget } from "../types";
import uniq from "lodash/uniq";

export const batchAuthorsForIDs = async (authorIDs: string[]): Promise<Map<string, User>> => {
  const unique = uniq(authorIDs);
  if (unique.length === 0) return new Map();

  const rows = await prisma.users.findMany({
    where: { id: { in: unique } },
  });

  return new Map(rows.map(row => [row.id, row]));
};

export const batchUserStatsForIDs = async (userIDs: string[]): Promise<Map<string, UserStats>> => {
  const unique = uniq(userIDs);
  const result = new Map(unique.map(id => [id, { postCount: 0, commentCount: 0, karma: 0, commentKarma: 0 }]));
  if (unique.length === 0) return result;

  const [posts, comments] = await Promise.all([
    prisma.post.findMany({ where: { authorID: { in: unique } }, select: { id: true, authorID: true } }),
    prisma.comment.findMany({ where: { authorID: { in: unique } }, select: { id: true, authorID: true } }),
  ]);
  const postIDs = posts.map(post => post.id);
  const commentIDs = comments.map(comment => comment.id);
  const voteSums = postIDs.length || commentIDs.length
    ? await prisma.vote.groupBy({
      by: ['targetType', 'targetID'],
      where: {
        OR: [
          ...(postIDs.length ? [{ targetType: 'post', targetID: { in: postIDs } }] : []),
          ...(commentIDs.length ? [{ targetType: 'comment', targetID: { in: commentIDs } }] : []),
        ],
      },
      _sum: { value: true },
    })
    : [];
  const postAuthorByID = new Map(posts.map(post => [post.id, post.authorID]));
  const commentAuthorByID = new Map(comments.map(comment => [comment.id, comment.authorID]));

  for (const post of posts) {
    const stats = result.get(post.authorID)!;
    stats.postCount += 1;
  }
  for (const comment of comments) {
    result.get(comment.authorID)!.commentCount += 1;
  }
  for (const row of voteSums) {
    const authorID = row.targetType === 'post' ? postAuthorByID.get(row.targetID) : commentAuthorByID.get(row.targetID);
    if (authorID) result.get(authorID)![row.targetType === 'post' ? 'karma' : 'commentKarma'] += Number(row._sum.value ?? 0);
  }

  return result;
};

const listEnrichedPosts = async (
  sort: FeedSort,
  where: Prisma.PostWhereInput | undefined,
  userID: string | undefined,
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
    userVotesForPosts(userID, ids),
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

export const listPostSorted = async (sort: FeedSort, tagFilter: string, userID: string | undefined, searchQuery = '') => {
  const filters: Prisma.PostWhereInput[] = [];
  if (tagFilter) filters.push({ postTags: { some: { tagSlug: tagFilter.toLowerCase() } } });

  const searchWhere = buildPostSearchWhere(searchQuery);
  if (searchWhere) filters.push(searchWhere);

  const where: Prisma.PostWhereInput | undefined = filters.length ? { AND: filters } : undefined;
  return listEnrichedPosts(sort, where, userID);
}

export const getCommunityFeedData = async (
  slug: string,
  sort: FeedSort,
  userID: string | undefined,
): Promise<CommunityFeed> => {
  const [rows, tags] = await Promise.all([
    listPostSorted(sort, slug, userID),
    listCommunity(),
  ]);
  const authorIDs = uniq(rows.map(({ post }) => post.authorID));
  const [authorsByID, authorStatsByID] = await Promise.all([
    batchAuthorsForIDs(authorIDs),
    batchUserStatsForIDs(authorIDs),
  ]);

  return {
    rows,
    authors: [...authorsByID.values()],
    authorStats: [...authorStatsByID.entries()],
    tags,
  };
};

export const listPostsByAuthor = async (authorID: string, sort: FeedSort, userID: string | undefined): Promise<FeedPostRow[]> => {
  return listEnrichedPosts(sort, { authorID }, userID);
}

const listVotedTargetIDs = async (userID: string, targetType: VoteTarget, value: -1 | 1): Promise<string[]> => {
  const votes = await prisma.vote.findMany({
    where: { userID, targetType, value },
    select: { targetID: true },
  });
  return votes.map(vote => vote.targetID);
};

export const listVotedPostsByUser = async (
  userID: string,
  value: -1 | 1,
  viewerID: string | undefined,
): Promise<FeedPostRow[]> => {
  const postIDs = await listVotedTargetIDs(userID, 'post', value);
  return postIDs.length ? listEnrichedPosts('new', { id: { in: postIDs } }, viewerID) : [];
};

const userVotesForPosts = async (
  userID: string | undefined,
  postIDs: string[],
): Promise<Map<string, -1 | 0 | 1>> => {
  const m = new Map<string, -1 | 0 | 1>();
  if (!userID || postIDs.length === 0) return m;
  const rows = await prisma.vote.findMany({
    where: {
      userID,
      targetType: "post",
      targetID: { in: postIDs },
    },
  });
  for (const r of rows) {
    const v = r.value;
    m.set(r.targetID, v === -1 || v === 1 ? v : 0);
  }
  return m;
};

export const listCommunity = cache(async (): Promise<Tag[]> => {
  const rows = await prisma.community.findMany({ orderBy: { slug: "asc" } });
  return rows.map((t) => ({
    slug: t.slug,
    label: t.label,
    hashColor: t.hashColor,
    avatarUrl: t.avatarUrl,
  }));
});

export const getCommunityBySlug = cache(async (slug: string): Promise<Community | null> => {
  const community = await prisma.community.findUnique({ where: { slug } });
  if (!community) return null;

  return {
    slug: community.slug,
    label: community.label,
    description: community.description,
    hashColor: community.hashColor,
    avatarUrl: community.avatarUrl,
    coverUrl: community.coverUrl,
    createdByID: community.createdByID ?? undefined,
    createdAt: community.createdAt.toISOString(),
  };
});

export const getCommunityStatsData = async (slug: string): Promise<CommunityStats> => {
  const posts = await prisma.post.findMany({
    where: { postTags: { some: { tagSlug: slug } } },
    select: { id: true },
  });
  const postIDs = posts.map(post => post.id);
  const [memberCount, commentCount] = await Promise.all([
    prisma.communityMembers.count({ where: { communitySlug: slug } }),
    postIDs.length ? prisma.comment.count({ where: { postID: { in: postIDs } } }) : Promise.resolve(0),
  ]);

  return { postCount: posts.length, memberCount, commentCount };
};

export const listCommunityMembers = async (slug: string): Promise<CommunityMember[]> => {
  const memberships = await prisma.communityMembers.findMany({
    where: { communitySlug: slug },
    orderBy: { joinedAt: 'desc' },
    take: 50,
  });
  const usersByID = await batchAuthorsForIDs(memberships.map(member => member.userID));

  return memberships.flatMap(member => {
    const user = usersByID.get(member.userID);
    return user ? [{ ...user, joinedAt: member.joinedAt.toISOString() }] : [];
  });
};

export const listJoinedCommunities = async (userID: string): Promise<Community[]> => {
  const memberships = await prisma.communityMembers.findMany({
    where: { userID },
    orderBy: { joinedAt: 'asc' },
    include: { community: true },
  });

  return memberships.map(({ community }) => ({
    slug: community.slug,
    label: community.label,
    description: community.description,
    hashColor: community.hashColor,
    avatarUrl: community.avatarUrl,
    coverUrl: community.coverUrl,
    createdByID: community.createdByID ?? undefined,
    createdAt: community.createdAt.toISOString(),
  }));
};

export const listOwnedCommunities = cache(async (userID: string): Promise<Community[]> => {
  const communities = await prisma.community.findMany({
    where: { createdByID: userID },
    orderBy: { slug: 'asc' },
  });

  return communities.map(community => ({
    slug: community.slug,
    label: community.label,
    description: community.description,
    hashColor: community.hashColor,
    avatarUrl: community.avatarUrl,
    coverUrl: community.coverUrl,
    createdByID: community.createdByID ?? undefined,
    createdAt: community.createdAt.toISOString(),
  }));
});

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
    tags: tags.map(tag => ({
      slug: tag.slug,
      label: tag.label,
      hashColor: tag.hashColor,
      avatarUrl: tag.avatarUrl,
      postCount: countMap.get(tag.slug) ?? 0,
    })),
  };
};

const tagsForPosts = async (postIDs: string[]): Promise<Map<string, string[]>> => {
  const m = new Map<string, string[]>();
  if (postIDs.length === 0) return m;

  const rows = await prisma.postTag.findMany({
    where: { postID: { in: postIDs } },
  });

  for (const pid of postIDs) m.set(pid, []); // nagawa ng empty m ap from parameter postids
  for (const r of rows) {
    const list = m.get(r.postID) ?? []; // kinukuha niya yung naunang gawa na map from parameter postids
    list.push(r.tagSlug);
    m.set(r.postID, list);
  }

  return m;
}

const voteSumsForPosts = async (postIDs: string[]): Promise<Map<string, number>> => {
  if (postIDs.length === 0) return new Map();
  const rows = await prisma.vote.groupBy({
    by: ["targetID"],
    where: {
      targetType: "post",
      targetID: { in: postIDs },
    },
    _sum: { value: true },
  });
  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.targetID, Number(r._sum.value ?? 0));
  }
  return m;
}

const mapPostRow = (row: PostModel, tagSlugs: string[], commentCount: number): Post => {
  return {
    id: row.id,
    authorID: row.authorID,
    title: row.title,
    body: row.body,
    imageUrls: row.imageUrls,
    tagSlugs,
    createdAt: row.createdAt.toISOString(),
    commentCount,
  };
}

export const getUserVote = async (userID: string | undefined, type: VoteTarget, targetID: string): Promise<-1 | 0 | 1> => {
  if (!userID) return 0;

  const row = await prisma.vote.findUnique({
    where: {
      userID_targetType_targetID: {
        userID,
        targetType: type,
        targetID,
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

export const listPostIDs = cache(async () => {
  const posts = await prisma.post.findMany({ select: { id: true } });
  return posts.map(post => post.id);
});

export const listUserNames = cache(async () => {
  const profiles = await prisma.users.findMany({ select: { userName: true } });
  return profiles.map(profile => profile.userName);
});

export const getAuthorByID = async (authorID: string): Promise<User | null> => {
  return prisma.users.findUnique({
    where: { id: authorID },
  });
};

export const getUserByUserName = cache(async (userName: string): Promise<User | null> => {
  return prisma.users.findUnique({ where: { userName } });
});

export const getUserStats = async (userID: string): Promise<UserStats> => {
  const posts = await prisma.post.findMany({
    where: { authorID: userID },
    select: { id: true },
  });
  const postIDs = posts.map(post => post.id);
  const comments = await prisma.comment.findMany({ where: { authorID: userID }, select: { id: true } });
  const targetIDs = [...postIDs, ...comments.map(comment => comment.id)];
  const voteRows = targetIDs.length
    ? await prisma.vote.groupBy({
      by: ['targetType', 'targetID'],
      where: {
        OR: [
          ...(postIDs.length ? [{ targetType: 'post', targetID: { in: postIDs } }] : []),
          ...(comments.length ? [{ targetType: 'comment', targetID: { in: comments.map(comment => comment.id) } }] : []),
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
    postID: row.postID,
    postTitle: row.post.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const listCommentsByAuthor = async (authorID: string): Promise<UserCommentActivity[]> => listComments({ authorID });

export const listVotedCommentsByUser = async (userID: string, value: -1 | 1): Promise<UserCommentActivity[]> => {
  const commentIDs = await listVotedTargetIDs(userID, 'comment', value);
  return commentIDs.length ? listComments({ id: { in: commentIDs } }) : [];
};

export const getPostScore = async (postID: string): Promise<number> => {
  const agg = await prisma.vote.aggregate({
    where: { targetType: "post", targetID: postID },
    _sum: { value: true },
  });
  return Number(agg._sum.value ?? 0);
}

export const getCommentTree = async (
  postID: string,
  sessionID?: string,
): Promise<EnrichedCommentNode[]> => {
  const flat = await listCommentsForPost(postID);

  if (flat.length === 0) return [];

  const authorIDs = uniq(flat.map(comment => comment.authorID));
  const commentIDs = flat.map(comment => comment.id);

  const [authors, scoreMap, voteMap] = await Promise.all([
    batchAuthorsForIDs(authorIDs),
    batchCommentScores(commentIDs),
    sessionID
      ? batchUserVotesForComments(sessionID, commentIDs)
      : Promise.resolve(new Map<string, -1 | 0 | 1>()),
  ]);

  const enriched = flat.flatMap(comment => {
    const author = authors.get(comment.authorID);

    if (!author) return [];

    return {
      ...comment,
      author,
      score: scoreMap.get(comment.id) ?? 0,
      userVote: voteMap.get(comment.id) ?? 0,
    };
  });

  return nestCommentRows(enriched);
};

export const batchUserVotesForComments = async (userID: string, commentIDs: string[]): Promise<Map<string, -1 | 0 | 1>> => {
  if (commentIDs.length === 0) return new Map();
  const rows = await prisma.vote.findMany({
    where: {
      userID,
      targetType: "comment",
      targetID: { in: commentIDs },
    },
  });
  const m = new Map<string, -1 | 0 | 1>();
  for (const r of rows) {
    m.set(r.targetID, r.value === -1 || r.value === 1 ? r.value : 0);
  }
  return m;
}

export const batchCommentScores = async (commentIDs: string[]): Promise<Map<string, number>> => {
  if (commentIDs.length === 0) return new Map();

  const rows = await prisma.vote.groupBy({
    by: ["targetID"],
    where: {
      targetType: "comment",
      targetID: { in: commentIDs }
    },
    _sum: { value: true }
  })

  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(r.targetID, Number(r._sum.value ?? 0));
  }

  return m
}

export const listCommentsForPost = async (postID: string): Promise<Comment[]> => {
  const rows = await prisma.comment.findMany({ where: { postID: postID } });

  return rows.map(c => ({
    id: c.id,
    postID: c.postID,
    authorID: c.authorID,
    parentID: c.parentID,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  }))
}

export const tagsPostCounts = cache(async (): Promise<TagPostCount[]> => {
  const allTags = await listCommunity();
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
