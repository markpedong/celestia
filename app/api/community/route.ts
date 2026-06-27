import { HTTP_MESSAGE } from '@/constants/enums';
import { getCurrentUserID } from '@/lib/auth';
import { getUploadErrorMessage } from '@/lib/error-messages';
import { uploadImage } from '@/lib/media';
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

const updateCommunityMedia = async (request: Request, userID: string) => {
  const formData = await request.formData();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const avatar = formData.get('avatar');
  const cover = formData.get('cover');

  const community = await prisma.community.findUnique({ where: { slug }, select: { createdByID: true } });
  if (!community) return generateErrorResponse('Community not found.', 404);
  if (community.createdByID !== userID) {
    return generateErrorResponse('Only the community owner can change these settings.', 403);
  }

  let avatarUrl: string | undefined;
  let coverUrl: string | undefined;

  try {
    [avatarUrl, coverUrl] = await Promise.all([
      uploadImage(avatar, 'community-avatars', userID),
      uploadImage(cover, 'community-covers', userID),
    ]);
  } catch (error) {
    return generateErrorResponse(getUploadErrorMessage(error, 'We could not upload your image. Please try again.'));
  }

  if (!avatarUrl && !coverUrl) return generateErrorResponse('Choose a community image or cover photo first.');

  const updatedCommunity = await prisma.community.update({
    where: { slug },
    data: {
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(coverUrl ? { coverUrl } : {}),
    },
  });

  revalidateCommunityPaths(slug);
  return generateSuccessResponse(updatedCommunity, 200, 'Community media updated.');
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

  if (request.headers.get('content-type')?.includes('multipart/form-data')) {
    return updateCommunityMedia(request, userID);
  }

  const { slug, label, description, hashColor } = await request.json();

  const community = await prisma.community.findUnique({ where: { slug }, select: { createdByID: true } });
  if (!community) return generateErrorResponse('Community not found.', 404);
  if (community.createdByID !== userID) {
    return generateErrorResponse('Only the community owner can change these settings.', 403);
  }

  const updatedCommunity = await prisma.community.update({
    where: { slug },
    data: { label, description, hashColor },
  });

  revalidateCommunityPaths(slug);

  return generateSuccessResponse(updatedCommunity);
};
