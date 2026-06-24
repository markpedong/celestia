import { prisma } from '../prisma';
import type { VoteActionValue, VoteTarget, VoteValue } from '../types';

export const toggleVote = async (
  userID: string,
  targetType: VoteTarget,
  targetID: string,
  value: VoteActionValue,
): Promise<VoteValue> => {
  return prisma.$transaction(async (tx) => {
    const current = await tx.vote.findUnique({
      where: { userID_targetType_targetID: { userID, targetType, targetID } },
      select: { value: true },
    });
    const next = current?.value === value ? 0 : value;

    if (next === 0) {
      await tx.vote.delete({
        where: { userID_targetType_targetID: { userID, targetType, targetID } },
      });
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
