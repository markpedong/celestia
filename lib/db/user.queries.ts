import { cache } from 'react';
import uniq from 'lodash/uniq';
import { prisma } from '@/lib/prisma';
import type { User, UserStats } from '@/lib/types';

const emptyUserStats = (): UserStats => ({ postCount: 0, commentCount: 0, karma: 0, commentKarma: 0 });

export const batchAuthorsForIDs = async (authorIDs: string[]): Promise<Map<string, User>> => {
  const unique = uniq(authorIDs);
  if (unique.length === 0) return new Map();

  const rows = await prisma.users.findMany({ where: { id: { in: unique } } });
  return new Map(rows.map(row => [row.id, row]));
};

export const batchUserStatsForIDs = async (userIDs: string[]): Promise<Map<string, UserStats>> => {
  const unique = uniq(userIDs);
  const result = new Map(unique.map(id => [id, emptyUserStats()]));
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

  for (const post of posts) result.get(post.authorID)!.postCount += 1;
  for (const comment of comments) result.get(comment.authorID)!.commentCount += 1;
  for (const row of voteSums) {
    const authorID = row.targetType === 'post'
      ? postAuthorByID.get(row.targetID)
      : commentAuthorByID.get(row.targetID);
    if (!authorID) continue;
    result.get(authorID)![row.targetType === 'post' ? 'karma' : 'commentKarma'] += Number(row._sum.value ?? 0);
  }

  return result;
};

export const getAuthorByID = async (authorID: string): Promise<User | null> => {
  return prisma.users.findUnique({ where: { id: authorID } });
};

export const getUserByUserName = cache(async (userName: string): Promise<User | null> => {
  return prisma.users.findUnique({ where: { userName } });
});

export const getUserStats = async (userID: string): Promise<UserStats> => {
  return (await batchUserStatsForIDs([userID])).get(userID) ?? emptyUserStats();
};

export const listUserNames = cache(async () => {
  const profiles = await prisma.users.findMany({ select: { userName: true } });
  return profiles.map(profile => profile.userName);
});
