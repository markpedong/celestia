import { getCurrentUserID } from '@/lib/auth';
import { toggleVote } from '@/lib/db/votes';
import { prisma } from '@/lib/prisma';
import type { VoteActionValue, VoteTarget } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { revalidatePath } from 'next/cache';

const isVoteTarget = (value: unknown): value is VoteTarget => value === 'post' || value === 'comment';
const isVoteValue = (value: unknown): value is VoteActionValue => value === 1 || value === -1;

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('Sign in to vote.', 401);

  const { target, targetID, value } = await request.json();
  if (!isVoteTarget(target) || typeof targetID !== 'string' || !isVoteValue(value)) {
    return generateErrorResponse('Invalid vote.');
  }

  const row = target === 'post'
    ? await prisma.post.findUnique({ where: { id: targetID }, select: { id: true } })
    : await prisma.comment.findUnique({ where: { id: targetID }, select: { postID: true } });
  if (!row) return generateErrorResponse(target === 'post' ? 'Post not found.' : 'Comment not found.', 404);

  const userVote = await toggleVote(userID, target, targetID, value);
  const postID = target === 'comment' && 'postID' in row ? row.postID : targetID;

  revalidatePath('/');
  revalidatePath(`/post/${postID}`);
  return generateSuccessResponse({ userVote });
};
