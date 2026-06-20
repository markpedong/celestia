import { prisma } from '../prisma';
import type { VoteActionValue, VoteTarget, VoteValue } from '../types';

export async function toggleVote(
  userId: string,
  targetType: VoteTarget,
  targetId: string,
  value: VoteActionValue,
): Promise<VoteValue> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.vote.findUnique({
      where: { userId_targetType_targetId: { userId, targetType, targetId } },
      select: { value: true },
    });
    const next = current?.value === value ? 0 : value;

    if (next === 0) {
      await tx.vote.delete({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
      });
    } else {
      await tx.vote.upsert({
        where: { userId_targetType_targetId: { userId, targetType, targetId } },
        create: { userId, targetType, targetId, value: next },
        update: { value: next },
      });
    }

    return next;
  });
}
