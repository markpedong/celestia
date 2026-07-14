import { prisma } from '@/lib/prisma';
import type { ContentActionKind, ContentActionTarget } from '@/lib/types';

export const isContentActionPair = (
  kind: unknown,
  targetType: unknown,
): kind is ContentActionKind => (
  (kind === 'saved' && (targetType === 'post' || targetType === 'comment')) ||
  (kind === 'hidden' && targetType === 'post') ||
  (kind === 'followed' && targetType === 'user') ||
  (kind === 'muted' && targetType === 'community')
);

export const contentTargetExists = async (targetType: ContentActionTarget, targetID: string) => {
  if (targetType === 'post') return Boolean(await prisma.post.findUnique({ where: { id: targetID }, select: { id: true } }));
  if (targetType === 'comment') return Boolean(await prisma.comment.findUnique({ where: { id: targetID }, select: { id: true } }));
  if (targetType === 'user') return Boolean(await prisma.users.findUnique({ where: { id: targetID }, select: { id: true } }));
  return Boolean(await prisma.community.findUnique({ where: { slug: targetID }, select: { slug: true } }));
};

export const listContentActions = (userID: string, kind: ContentActionKind) =>
  prisma.contentAction.findMany({
    where: { userID, kind },
    orderBy: { createdAt: 'desc' },
  });
