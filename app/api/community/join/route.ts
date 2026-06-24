import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserID } from '@/lib/auth';
import { generateErrorResponse } from '@/services/request';
import { HTTP_MESSAGE } from '@/constants/enums';

export const POST = async (req: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

  const { slug: communitySlug } = await req.json();
  if (!communitySlug) return generateErrorResponse('Community slug is required.', 400);

  const community = await prisma.community.findUnique({
    where: { slug: communitySlug },
    select: { createdById: true },
  });
  if (!community) return generateErrorResponse('Community not found.', 404);

  const existingMembership = await prisma.communityMembers.findUnique({
    where: { userId_communitySlug: { userId: userID, communitySlug }, },
    select: { userId: true },
  });

  const isMember = Boolean(existingMembership);

  if (isMember) {
    if (community.createdById === userID) {
      return generateErrorResponse('Community owners cannot leave their community.', 403);
    }

    await prisma.communityMembers.delete({
      where: {
        userId_communitySlug: {
          userId: userID,
          communitySlug,
        },
      },
    });
  } else {
    await prisma.communityMembers.create({
      data: {
        userId: userID,
        communitySlug,
      },
    });
  }

  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${communitySlug}`);

  return NextResponse.json({
    isMember: !isMember,
  });
};