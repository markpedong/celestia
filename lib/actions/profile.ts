'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { uploadImage } from '../media';
import { prisma } from '../prisma';

export type ProfileMediaFormState = { error?: string; success?: string } | null;

export const updateProfileMediaAction = async (
  _prev: ProfileMediaFormState,
  formData: FormData,
): Promise<ProfileMediaFormState> => {
  const profile = await getSessionUser();
  if (!profile) return { error: 'You must be signed in to update your profile.' };

  let avatarUrl: string | undefined;
  let coverUrl: string | undefined;

  try {
    [avatarUrl, coverUrl] = await Promise.all([
      uploadImage(formData.get('avatar'), 'profile-avatars', profile.id),
      uploadImage(formData.get('cover'), 'profile-covers', profile.id),
    ]);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to upload image.' };
  }

  if (!avatarUrl && !coverUrl) return { error: 'Choose a profile image or cover photo first.' };

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(coverUrl ? { coverUrl } : {}),
    },
  });

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath(`/u/${profile.username}`);
  return { success: 'Profile media updated.' };
};
