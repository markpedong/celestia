import { PostModel } from "../generated/prisma/models";
import { prisma } from "../prisma";
import { FeedSort, Post, User } from "../types";

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

export const listPostSorted = async (sort: FeedSort, tagFilter: string) => {
  const where = tagFilter ? { postTags: { some: { tagSlug: tagFilter.toLowerCase() } } } : undefined;
  const postRows = await prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 })
  const ids = postRows.map((row) => row.id);

  if (ids.length === 0) return [];

  const [tagMap] = await Promise.all([tagsForPosts(ids)])

  const mapped = postRows.map(row => {
    const slugs = tagMap.get(row.id) ?? [];

    return {
      post: mapPostRow(row, slugs, 65),
      voteScore: 2,
      created: row.createdAt.getTime(),
      tagSlugs: slugs,
      userVote: 0 as const
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

const tagsForPosts = async (postIds: string[]): Promise<Map<string, string[]>> => {
  const m = new Map<string, string[]>();
  if (postIds.length === 0) return m;

  const rows = await prisma.postTag.findMany({
    where: { postId: { in: postIds } },
  });

  for (const pid of postIds) m.set(pid, []);
  for (const r of rows) {
    const list = m.get(r.postId) ?? [];
    list.push(r.tagSlug);
    m.set(r.postId, list);
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
