'use server';

import { getCurrentUserID } from '../auth';
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
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'You must be signed in to create a community.' };

  const label = String(formData.get('label') ?? '').trim();
  const slug = normalizeSlug(String(formData.get('slug') ?? ''));
  const description = String(formData.get('description') ?? '').trim();
  const hashColor = String(formData.get('hashColor') ?? '').trim();

  if (slug.length < MIN_COMMUNITY_SLUG_LENGTH || RESERVED_COMMUNITY_SLUGS.has(slug)) return { error: 'Choose a different community URL.' };

  const existing = await prisma.community.findUnique({ where: { slug }, select: { slug: true } });
  if (existing) return { error: 'That community URL is already taken.' };

  await prisma.$transaction(async (tx) => {
    await tx.community.create({
      data: { slug, label, description, hashColor, createdById: userId },
    });
    await tx.communityMembers.create({ data: { userId, communitySlug: slug } });
  });

  revalidatePath('/');
  revalidatePath('/submit');
  redirect(`/r/${slug}`);
};

export const setCommunityMembershipAction = async (slug: string, shouldJoin: boolean) => {
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'Sign in to join a community.' };

  const communitySlug = slug.trim().toLowerCase();
  const community = await prisma.community.findUnique({ where: { slug: communitySlug }, select: { slug: true, createdById: true } });
  if (!community) return { error: 'Community not found.' };

  if (!shouldJoin && community.createdById === userId) {
    return { error: 'Community owners cannot leave their community.' };
  }

  if (shouldJoin) {
    await prisma.communityMembers.upsert({
      where: { userId_communitySlug: { userId, communitySlug } },
      create: { userId, communitySlug },
      update: {},
    });
  } else {
    await prisma.communityMembers.deleteMany({ where: { userId, communitySlug } });
  }

  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${communitySlug}`);
  return { isMember: shouldJoin };
};

export const getCommunityMembershipAction = async (slug: string) => {
  const userId = await getCurrentUserID();
  if (!userId) return { isMember: false };

  const membership = await prisma.communityMembers.findUnique({
    where: { userId_communitySlug: { userId, communitySlug: slug.trim().toLowerCase() } },
    select: { userId: true },
  });

  return { isMember: Boolean(membership) };
};

export const updateCommunityAction = async (
  _previousState: CommunitySettingsFormState,
  formData: FormData,
): Promise<CommunitySettingsFormState> => {
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'You must be signed in to manage a community.' };

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const label = String(formData.get('label') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const hashColor = String(formData.get('hashColor') ?? '').trim();


  const community = await prisma.community.findUnique({ where: { slug }, select: { createdById: true } });
  if (!community) return { error: 'Community not found.' };
  if (community.createdById !== userId) return { error: 'Only the community owner can change these settings.' };

  await prisma.community.update({ where: { slug }, data: { label, description, hashColor } });
  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${slug}`);
  revalidatePath(`/r/${slug}/settings`);
  redirect(`/r/${slug}`);
};
