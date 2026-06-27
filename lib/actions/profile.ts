'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { prisma } from '../prisma';
import type { ProfileMediaFormState } from '../types';
import { profileSettingsSchema } from '../form-schemas';

const revalidateProfilePaths = (...usernames: string[]) => {
  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/settings');
  for (const userName of new Set(usernames)) revalidatePath(`/u/${userName}`);
};

export const updateProfileMediaAction = async (
  { avatarUrl, coverUrl }: { avatarUrl?: string; coverUrl?: string },
): Promise<ProfileMediaFormState> => {
  const profile = await getSessionUser();
  if (!profile) return { error: 'You must be signed in to update your profile.' };

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
