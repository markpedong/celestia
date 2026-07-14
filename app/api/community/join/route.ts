import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUserID } from '@/lib/auth';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { HTTP_MESSAGE } from '@/constants/enums';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const POST = async (req: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);
  if (!await checkRateLimit(`community-join:${userID}`, 40, 600)) {
    return generateErrorResponse('Membership update limit reached. Try again later.', 429);
  }

  const { slug } = await req.json();
  const communitySlug = String(slug ?? '').trim().toLowerCase();
  if (!communitySlug) return generateErrorResponse(HTTP_MESSAGE.SLUG_REQUIRED, 400);

  const community = await prisma.community.findUnique({
    where: { slug: communitySlug },
    select: { createdByID: true },
  });
  if (!community) return generateErrorResponse('Community not found.', 404);

  const existingMembership = await prisma.communityMembers.findUnique({
    where: { userID_communitySlug: { userID, communitySlug }, },
    select: { userID: true },
  });

  const isMember = Boolean(existingMembership);

  if (isMember) {
    if (community.createdByID === userID) return generateErrorResponse('Community owners cannot leave their community.', 403);

    await prisma.$transaction([
      prisma.communityMembers.delete({ where: { userID_communitySlug: { userID, communitySlug } } }),
      prisma.chatParticipant.deleteMany({
        where: { userID, conversation: { communitySlug } },
      }),
    ]);
  } else {
    await prisma.$transaction(async tx => {
      await tx.communityMembers.create({ data: { userID, communitySlug } });
      const conversation = await tx.chatConversation.upsert({
        where: { communitySlug },
        create: { type: 'community', communitySlug },
        update: {},
        select: { id: true },
      });
      await tx.chatParticipant.upsert({
        where: { conversationID_userID: { conversationID: conversation.id, userID } },
        create: { conversationID: conversation.id, userID },
        update: {},
      });
    });
  }

  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${communitySlug}`);

  return generateSuccessResponse({ isMember: !isMember });
};
