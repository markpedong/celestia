import { HTTP_MESSAGE } from '@/constants/enums';
import { getCurrentUserID } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { revalidatePath } from 'next/cache';

export const GET = async (request: Request,) => {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') ?? '';

  const community = await prisma.community.findFirst({ where: { slug } });
  if (!community) return generateErrorResponse('Community not found.', 404);

  return generateSuccessResponse(community);
};

const revalidateCommunityPaths = (slug: string) => {
  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${slug}`);
  revalidatePath(`/r/${slug}/settings`);
  revalidatePath(`/settings/communities/${slug}`);
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

  const { slug, label, description, hashColor, avatarUrl, coverUrl } = await request.json();

  const community = await prisma.community.findUnique({ where: { slug }, select: { createdByID: true } });
  if (!community) return generateErrorResponse('Community not found.', 404);
  if (community.createdByID !== userID) {
    return generateErrorResponse('Only the community owner can change these settings.', 403);
  }

  const updatedCommunity = await prisma.community.update({
    where: { slug },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(hashColor !== undefined ? { hashColor } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(coverUrl ? { coverUrl } : {}),
    },
  });

  revalidateCommunityPaths(slug);

  return generateSuccessResponse(updatedCommunity);
};
