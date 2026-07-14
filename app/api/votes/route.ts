import { getCurrentUserID } from '@/lib/auth';
import { getUserVote, setVote, voteSumsForTargets } from '@/lib/db/vote.queries';
import { prisma } from '@/lib/prisma';
import { invalidateFeedCache } from '@/lib/server/feed-cache';
import { checkRateLimit } from '@/lib/server/rate-limit';
import type { VoteTarget, VoteValue } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { revalidatePath } from 'next/cache';

const isVoteTarget = (value: unknown): value is VoteTarget => value === 'post' || value === 'comment';
const isVoteValue = (value: unknown): value is VoteValue => value === -1 || value === 0 || value === 1;

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('target');
  const targetID = searchParams.get('targetID');
  if (!isVoteTarget(target) || !targetID) return generateErrorResponse('Invalid vote target.');

  const userID = await getCurrentUserID();
  const [scoreMap, userVote] = await Promise.all([
    voteSumsForTargets(target, [targetID]),
    getUserVote(userID, target, targetID),
  ]);

  return generateSuccessResponse({ score: scoreMap.get(targetID) ?? 0, userVote });
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('Sign in to vote.', 401);
  if (!await checkRateLimit(`vote:${userID}`, 180, 60)) {
    return generateErrorResponse('You are voting too quickly. Try again in a moment.', 429);
  }

  const { target, targetID, value } = await request.json();
  if (!isVoteTarget(target) || typeof targetID !== 'string' || !isVoteValue(value)) {
    return generateErrorResponse('Invalid vote.');
  }

  const row = target === 'post'
    ? await prisma.post.findUnique({ where: { id: targetID }, select: { id: true } })
    : await prisma.comment.findUnique({ where: { id: targetID }, select: { postID: true } });
  if (!row) return generateErrorResponse(target === 'post' ? 'Post not found.' : 'Comment not found.', 404);

  const result = await setVote(userID, target, targetID, value);
  const postID = target === 'comment' && 'postID' in row ? row.postID : targetID;

  revalidatePath('/');
  revalidatePath(`/post/${postID}`);
  if (target === 'post') await invalidateFeedCache();
  return generateSuccessResponse(result);
};
