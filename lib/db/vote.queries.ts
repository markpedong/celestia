import { prisma } from '@/lib/prisma';
import type { VoteTarget, VoteValue } from '@/lib/types';

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

export const setVote = async (
  userID: string,
  targetType: VoteTarget,
  targetID: string,
  value: VoteValue,
): Promise<{ userVote: VoteValue; score: number }> => {
  return prisma.$transaction(async tx => {
    if (value === 0) {
      await tx.vote.deleteMany({ where: { userID, targetType, targetID } });
    } else {
      await tx.vote.upsert({
        where: { userID_targetType_targetID: { userID, targetType, targetID } },
        create: { userID, targetType, targetID, value },
        update: { value },
      });
    }

    const aggregate = await tx.vote.aggregate({
      where: { targetType, targetID },
      _sum: { value: true },
    });

    return { userVote: value, score: Number(aggregate._sum.value ?? 0) };
  });
};
