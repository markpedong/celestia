'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { uploadImage } from '../media';
import { prisma } from '../prisma';
import type { ProfileMediaFormState } from '../types';
import { getUploadErrorMessage } from '../error-messages';
import { profileSettingsSchema } from '../form-schemas';

const revalidateProfilePaths = (...usernames: string[]) => {
  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/settings');
  for (const userName of new Set(usernames)) revalidatePath(`/u/${userName}`);
};

export const updateProfileMediaAction = async (
  { avatar, cover }: { avatar?: FileList; cover?: FileList },
): Promise<ProfileMediaFormState> => {
  const profile = await getSessionUser();
  if (!profile) return { error: 'You must be signed in to update your profile.' };

  let avatarUrl: string | undefined;
  let coverUrl: string | undefined;

  try {
    [avatarUrl, coverUrl] = await Promise.all([
      uploadImage(avatar?.[0] ?? null, 'profile-avatars', profile.id),
      uploadImage(cover?.[0] ?? null, 'profile-covers', profile.id),
    ]);
  } catch (error) {
    return { error: getUploadErrorMessage(error, 'We could not upload your image. Please try again.') };
  }

  if (!avatarUrl && !coverUrl) return { error: 'Choose a profile image or cover photo first.' };

  await prisma.users.update({
    where: { id: profile.id },
    data: {
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(coverUrl ? { coverUrl } : {}),
    },
  });

  revalidateProfilePaths(profile.userName);
  return { success: 'Profile media updated.' };
};

export const updateProfileSettingsAction = async (
  { displayName, bio }: { displayName: string; bio: string },
): Promise<ProfileMediaFormState> => {
  const profile = await getSessionUser();
  if (!profile) return { error: 'You must be signed in to update your profile.' };

  const parsed = profileSettingsSchema.safeParse({
    userName: profile.userName,
    displayName,
    bio,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your profile details.' };

  await prisma.users.update({
    where: { id: profile.id },
    data: {
      displayName: parsed.data.displayName || null,
      bio: parsed.data.bio || null,
    },
  });

  revalidateProfilePaths(profile.userName);
  return { success: 'Profile details updated.' };
};
