'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { uploadImage } from '../media';
import { prisma } from '../prisma';
import type { ProfileMediaFormState } from '../types';
import { getUploadErrorMessage } from '../error-messages';
import { profileSettingsSchema } from '../form-schemas';
import { createSupabaseServerClient } from '../supabase/server';

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

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath(`/u/${profile.username}`);
  return { success: 'Profile media updated.' };
};

export const updateProfileSettingsAction = async (
  _prev: ProfileMediaFormState,
  formData: FormData,
): Promise<ProfileMediaFormState> => {
  const profile = await getSessionUser();
  if (!profile) return { error: 'You must be signed in to update your profile.' };

  const parsed = profileSettingsSchema.safeParse({
    username: formData.get('username'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your profile details.' };

  const username = parsed.data.username;
  const existing = await prisma.userProfile.findUnique({ where: { username }, select: { id: true } });
  if (existing && existing.id !== profile.id) return { error: 'That username is already taken.' };

  const supabase = await createSupabaseServerClient();
  const { error: authError } = await supabase.auth.updateUser({ data: { username } });
  if (authError) return { error: 'We could not update your username. Please try again.' };

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: {
      username,
    },
  });

  revalidatePath('/profile/settings');
  revalidatePath('/profile');
  revalidatePath(`/u/${profile.username}`);
  revalidatePath(`/u/${username}`);
  return { success: 'Profile details updated.' };
};
