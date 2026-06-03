import { prisma } from "../prisma";
import { FeedSort, Post } from "../types";

export type FeedPostRow = {
  post: Post
  score: number
  userVote: -1 | 0 | 1
}

export const listPostSorted = async (sort: FeedSort, tagFilter: string, userID: string) => {
  const where = tagFilter ? { postTags: { some: { tagSlug: tagFilter.toLowerCase() } } } : undefined;
  const postRows = await prisma.post.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 })
  const ids = postRows.map((row) => row.id);

  if (ids.length === 0) return [];

  const [tagMap] = await Promise.all([tagsForPosts(ids)])

  const mapped = postRows.map(row => {
    const slugs = tagMap.get(row.id) ?? [];
    return {
      ...row,
      tagSlugs: slugs,
    }
  })
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