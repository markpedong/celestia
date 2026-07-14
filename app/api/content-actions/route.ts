import { getCurrentUserID } from '@/lib/auth';
import { contentTargetExists, isContentActionPair } from '@/lib/db/content.queries';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/server/rate-limit';
import type { ContentActionKind, ContentActionTarget } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { revalidatePath } from 'next/cache';

const revalidateTarget = (targetType: ContentActionTarget, targetID: string) => {
  if (targetType === 'post') revalidatePath(`/post/${targetID}`);
  if (targetType === 'user') revalidatePath('/u/[username]', 'page');
  if (targetType === 'community') revalidatePath(`/r/${targetID}`);
  revalidatePath('/saved');
};

export const GET = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in.', 401);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind');
  const targetType = searchParams.get('targetType');
  const targetID = searchParams.get('targetID')?.trim();
  if (!targetID || !isContentActionPair(kind, targetType)) return generateErrorResponse('Invalid content action.');

  const action = await prisma.contentAction.findUnique({
    where: {
      userID_kind_targetType_targetID: {
        userID,
        kind: kind as ContentActionKind,
        targetType: targetType as ContentActionTarget,
        targetID,
      },
    },
    select: { userID: true },
  });
  return generateSuccessResponse({ active: Boolean(action) });
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in.', 401);
  if (!await checkRateLimit(`content-action:${userID}`, 120, 600)) {
    return generateErrorResponse('Action limit reached. Try again later.', 429);
  }

  const { kind, targetType, targetID: rawTargetID, enabled } = await request.json();
  const targetID = typeof rawTargetID === 'string' ? rawTargetID.trim() : '';
  if (!targetID || typeof enabled !== 'boolean' || !isContentActionPair(kind, targetType)) {
    return generateErrorResponse('Invalid content action.');
  }
  if (kind === 'followed' && targetID === userID) return generateErrorResponse('You cannot follow yourself.');
  if (!await contentTargetExists(targetType as ContentActionTarget, targetID)) {
    return generateErrorResponse('Content not found.', 404);
  }

  const key = {
    userID,
    kind: kind as ContentActionKind,
    targetType: targetType as ContentActionTarget,
    targetID,
  };
  const existing = enabled ? await prisma.contentAction.findUnique({
    where: { userID_kind_targetType_targetID: key },
    select: { userID: true },
  }) : null;
  if (enabled) {
    await prisma.contentAction.upsert({
      where: { userID_kind_targetType_targetID: key },
      create: key,
      update: {},
    });
  } else {
    await prisma.contentAction.deleteMany({ where: key });
  }
  if (enabled && !existing && kind === 'followed') {
    await prisma.notification.create({
      data: {
        userID: targetID,
        actorID: userID,
        type: 'follow',
        message: 'Someone followed you.',
        href: `/u/${encodeURIComponent((await prisma.users.findUnique({ where: { id: userID }, select: { userName: true } }))?.userName ?? '')}`,
      },
    });
  }

  revalidateTarget(targetType as ContentActionTarget, targetID);
  return generateSuccessResponse({ active: enabled }, 200, 'Preference updated.');
};
