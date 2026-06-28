import uniq from 'lodash/uniq';
import { Prisma } from '@/lib/generated/prisma/client';
import { nestCommentRows } from '@/lib/comment-tree';
import { prisma } from '@/lib/prisma';
import type { EnrichedCommentNode, UserCommentActivity } from '@/lib/types';
import { batchAuthorsForIDs } from './user.queries';
import { listVotedTargetIDs, userVotesForTargets, voteSumsForTargets } from './vote.queries';

export const listComments = async (where: Prisma.CommentWhereInput): Promise<UserCommentActivity[]> => {
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

export const listVotedCommentsByUser = async (
  userID: string,
  value: -1 | 1,
): Promise<UserCommentActivity[]> => {
  const commentIDs = await listVotedTargetIDs(userID, 'comment', value);
  return commentIDs.length ? listComments({ id: { in: commentIDs } }) : [];
};

export const getCommentTree = async (
  postID: string,
  sessionID?: string,
): Promise<EnrichedCommentNode[]> => {
  const flat = (await prisma.comment.findMany({ where: { postID } })).map((row) => ({
    id: row.id,
    postID: row.postID,
    authorID: row.authorID,
    parentID: row.parentID,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }));
  if (flat.length === 0) return [];

  const authorIDs = uniq(flat.map(comment => comment.authorID));
  const commentIDs = flat.map(comment => comment.id);

  const [authors, scoreMap, voteMap] = await Promise.all([
    batchAuthorsForIDs(authorIDs),
    voteSumsForTargets('comment', commentIDs),
    userVotesForTargets(sessionID, 'comment', commentIDs),
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
