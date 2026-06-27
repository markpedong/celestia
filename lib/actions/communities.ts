'use server';

import { getCurrentUserID } from '../auth';
import { getUploadErrorMessage } from '../error-messages';
import { uploadImage } from '../media';
import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CommunityFormState, CommunitySettingsFormState } from '../types';
import { MAX_COMMUNITY_SLUG_LENGTH, MIN_COMMUNITY_SLUG_LENGTH, RESERVED_COMMUNITY_SLUGS } from '../../constants';

const normalizeSlug = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, MAX_COMMUNITY_SLUG_LENGTH);

export const createCommunityAction = async (
  _previousState: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> => {
  const userID = await getCurrentUserID();
  if (!userID) return { error: 'You must be signed in to create a community.' };

  const label = String(formData.get('label') ?? '').trim();
  const slug = normalizeSlug(String(formData.get('slug') ?? ''));
  const description = String(formData.get('description') ?? '').trim();
  const hashColor = String(formData.get('hashColor') ?? '').trim();
  const avatar = formData.get('avatar');
  const cover = formData.get('cover');

  if (slug.length < MIN_COMMUNITY_SLUG_LENGTH || RESERVED_COMMUNITY_SLUGS.has(slug)) return { error: 'Choose a different community URL.' };

  const existing = await prisma.community.findUnique({ where: { slug }, select: { slug: true } });
  if (existing) return { error: 'That community URL is already taken.' };

  let avatarUrl: string | undefined;
  let coverUrl: string | undefined;

  try {
    [avatarUrl, coverUrl] = await Promise.all([
      uploadImage(avatar, 'community-avatars', userID),
      uploadImage(cover, 'community-covers', userID),
    ]);
  } catch (error) {
    return { error: getUploadErrorMessage(error, 'We could not upload your image. Please try again.') };
  }

  await prisma.$transaction(async (tx) => {
    await tx.community.create({
      data: { slug, label, description, hashColor, avatarUrl, coverUrl, createdByID: userID },
    });
    await tx.communityMembers.create({ data: { userID, communitySlug: slug } });
  });

  revalidatePath('/');
  revalidatePath('/submit');
  redirect(`/r/${slug}`);
};

export const setCommunityMembershipAction = async (slug: string, shouldJoin: boolean) => {
  const userID = await getCurrentUserID();
  if (!userID) return { error: 'Sign in to join a community.' };

  const communitySlug = slug.trim().toLowerCase();
  const community = await prisma.community.findUnique({ where: { slug: communitySlug }, select: { slug: true, createdByID: true } });
  if (!community) return { error: 'Community not found.' };

  if (!shouldJoin && community.createdByID === userID) {
    return { error: 'Community owners cannot leave their community.' };
  }

  if (shouldJoin) {
    await prisma.communityMembers.upsert({
      where: { userID_communitySlug: { userID, communitySlug } },
      create: { userID, communitySlug },
      update: {},
    });
  } else {
    await prisma.communityMembers.deleteMany({ where: { userID, communitySlug } });
  }

  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${communitySlug}`);
  return { isMember: shouldJoin };
};

export const updateCommunityAction = async (
  _previousState: CommunitySettingsFormState,
  formData: FormData,
): Promise<CommunitySettingsFormState> => {
  const userID = await getCurrentUserID();
  if (!userID) return { error: 'You must be signed in to manage a community.' };

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const label = String(formData.get('label') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const hashColor = String(formData.get('hashColor') ?? '').trim();


  const community = await prisma.community.findUnique({ where: { slug }, select: { createdByID: true } });
  if (!community) return { error: 'Community not found.' };
  if (community.createdByID !== userID) return { error: 'Only the community owner can change these settings.' };

  await prisma.community.update({ where: { slug }, data: { label, description, hashColor } });
  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${slug}`);
  revalidatePath(`/r/${slug}/settings`);
  revalidatePath(`/settings/communities/${slug}`);
  redirect(`/settings/communities/${slug}`);
};
