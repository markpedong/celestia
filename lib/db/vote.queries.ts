import { prisma } from '@/lib/prisma';
import type { VoteActionValue, VoteTarget, VoteValue } from '@/lib/types';

export const listVotedTargetIDs = async (userID: string, targetType: VoteTarget, value: -1 | 1): Promise<string[]> => {
  const votes = await prisma.vote.findMany({
    where: { userID, targetType, value },
    select: { targetID: true },
  });
  return votes.map(vote => vote.targetID);
};

export const voteSumsForTargets = async (
  targetType: VoteTarget,
  targetIDs: string[],
): Promise<Map<string, number>> => {
  if (targetIDs.length === 0) return new Map();

  const rows = await prisma.vote.groupBy({
    by: ['targetID'],
    where: { targetType, targetID: { in: targetIDs } },
    _sum: { value: true },
  });

  return new Map(rows.map(row => [row.targetID, Number(row._sum.value ?? 0)]));
};

export const userVotesForTargets = async (
  userID: string | undefined,
  targetType: VoteTarget,
  targetIDs: string[],
): Promise<Map<string, -1 | 0 | 1>> => {
  const votes = new Map<string, -1 | 0 | 1>();
  if (!userID || targetIDs.length === 0) return votes;

  const rows = await prisma.vote.findMany({
    where: { userID, targetType, targetID: { in: targetIDs } },
  });

  for (const row of rows) {
    votes.set(row.targetID, row.value === -1 || row.value === 1 ? row.value : 0);
  }

  return votes;
};

export const getUserVote = async (
  userID: string | undefined,
  targetType: VoteTarget,
  targetID: string,
): Promise<-1 | 0 | 1> => {
  if (!userID) return 0;
  return (await userVotesForTargets(userID, targetType, [targetID])).get(targetID) ?? 0;
};

export const getPostScore = async (postID: string): Promise<number> => {
  return (await voteSumsForTargets('post', [postID])).get(postID) ?? 0;
};

export const toggleVote = async (
  userID: string,
  targetType: VoteTarget,
  targetID: string,
  value: VoteActionValue,
): Promise<VoteValue> => {
  return prisma.$transaction(async tx => {
    const current = await tx.vote.findUnique({
      where: { userID_targetType_targetID: { userID, targetType, targetID } },
      select: { value: true },
    });
    const next = current?.value === value ? 0 : value;

    if (next === 0) {
      await tx.vote.delete({ where: { userID_targetType_targetID: { userID, targetType, targetID } } });
    } else {
      await tx.vote.upsert({
        where: { userID_targetType_targetID: { userID, targetType, targetID } },
        create: { userID, targetType, targetID, value: next },
        update: { value: next },
      });
    }

    return next;
  });
};
