'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../auth';
import { ensureUserProfile } from '../db/user-profile';
import { imageDataUrlFromFile } from '../media';
import { prisma } from '../prisma';

export type ProfileMediaFormState = { error?: string; success?: string } | null;

export async function updateProfileMediaAction(
  _prev: ProfileMediaFormState,
  formData: FormData,
): Promise<ProfileMediaFormState> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { error: 'You must be signed in to update your profile.' };

  let avatarUrl: string | undefined;
  let coverUrl: string | undefined;

  try {
    [avatarUrl, coverUrl] = await Promise.all([
      imageDataUrlFromFile(formData.get('avatar')),
      imageDataUrlFromFile(formData.get('cover')),
    ]);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to upload image.' };
  }

  if (!avatarUrl && !coverUrl) return { error: 'Choose a profile image or cover photo first.' };

  const profile = await ensureUserProfile(session.user);
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
}
