import { USER_FIELDS } from '@/constants';
import { getCurrentUserID } from '@/lib/auth';
import { getUserByID } from '@/lib/db/user.queries';
import { profileDetailsSchema } from '@/lib/form-schemas';
import { prisma } from '@/lib/prisma';
import { isOwnedPublicFileUrl } from '@/lib/storage';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import pick from 'lodash/pick';
import { revalidatePath } from 'next/cache';

export const GET = async () => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('Unauthorized.', 401);
  
  const profile = await getUserByID(userID);
  return profile ? generateSuccessResponse(profile) : generateErrorResponse('User not found', 404);
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('Unauthorized.', 401);

  const body = await request.json();
  const data = pick(body, USER_FIELDS);

  if (!Object.keys(data).length) {
    return generateErrorResponse('No fields to update.', 400);
  }

  const profile = await prisma.users.findUnique({
    where: { id: userID },
    select: { userName: true, displayName: true, bio: true },
  });
  if (!profile) return generateErrorResponse('User not found.', 404);

  if ('displayName' in data || 'bio' in data) {
    const parsed = profileDetailsSchema.safeParse({
      displayName: data.displayName ?? profile.displayName ?? '',
      bio: data.bio ?? profile.bio ?? '',
    });
    if (!parsed.success) return generateErrorResponse(parsed.error.issues[0]?.message ?? 'Check your profile details.');
    data.displayName = parsed.data.displayName || null;
    data.bio = parsed.data.bio || null;
  }

  for (const [field, bucket] of [
    ['avatarUrl', 'profile-avatars'],
    ['coverUrl', 'profile-covers'],
  ] as const) {
    const imageUrl = data[field];
    if (imageUrl != null && (typeof imageUrl !== 'string' || !isOwnedPublicFileUrl(imageUrl, bucket, userID))) {
      return generateErrorResponse('Invalid profile image.');
    }
  }

  await prisma.users.update({ where: { id: userID }, data });

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/settings');
  revalidatePath(`/u/${profile.userName}`);

  return generateSuccessResponse(null, 200, 'Profile updated successfully.');
}
