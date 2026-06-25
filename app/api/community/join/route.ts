import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUserID } from '@/lib/auth';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { HTTP_MESSAGE } from '@/constants/enums';

export const POST = async (req: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

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

    await prisma.communityMembers.delete({ where: { userID_communitySlug: { userID, communitySlug } } });
  } else {
    await prisma.communityMembers.create({ data: { userID, communitySlug } });
  }

  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${communitySlug}`);

  return generateSuccessResponse({ isMember: !isMember });
};
