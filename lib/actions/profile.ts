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
  for (const username of new Set(usernames)) revalidatePath(`/u/${username}`);
};

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
    return { error: getUploadErrorMessage(error, 'We could not upload your image. Please try again.') };
  }

  if (!avatarUrl && !coverUrl) return { error: 'Choose a profile image or cover photo first.' };

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(coverUrl ? { coverUrl } : {}),
    },
  });

  revalidateProfilePaths(profile.username);
  return { success: 'Profile media updated.' };
};

export const updateProfileSettingsAction = async (
  _prev: ProfileMediaFormState,
  formData: FormData,
): Promise<ProfileMediaFormState> => {
  const profile = await getSessionUser();
  if (!profile) return { error: 'You must be signed in to update your profile.' };

  const parsed = profileSettingsSchema.safeParse({
    username: profile.username,
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your profile details.' };

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      displayName: parsed.data.displayName || null,
      bio: parsed.data.bio || null,
    },
  });

  revalidateProfilePaths(profile.username);
  return { success: 'Profile details updated.' };
};
