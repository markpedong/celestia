'use server';

import { getCurrentUserID } from '../auth';
import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { CommunityFormState, CommunitySettingsFormState } from '../types';

const RESERVED_SLUGS = new Set(['all', 'auth', 'communities', 'new', 'post', 'profile', 'r', 'submit', 'u']);

const normalizeSlug = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 32);

export async function createCommunityAction(
  _previousState: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'You must be signed in to create a community.' };

  const label = String(formData.get('label') ?? '').trim();
  const slug = normalizeSlug(String(formData.get('slug') ?? ''));
  const description = String(formData.get('description') ?? '').trim();
  const hashColor = String(formData.get('hashColor') ?? '').trim();

  if (label.length < 3 || label.length > 60) return { error: 'Community name must be 3–60 characters.' };
  if (slug.length < 3 || RESERVED_SLUGS.has(slug)) return { error: 'Choose a different community URL.' };
  if (description.length > 500) return { error: 'Description must be 500 characters or fewer.' };
  if (!/^#[0-9a-f]{6}$/i.test(hashColor)) return { error: 'Choose a valid community color.' };

  const existing = await prisma.tag.findUnique({ where: { slug }, select: { slug: true } });
  if (existing) return { error: 'That community URL is already taken.' };

  await prisma.$transaction(async (tx) => {
    await tx.tag.create({
      data: { slug, label, description, hashColor, createdById: userId },
    });
    await tx.communityMembership.create({ data: { userId, communitySlug: slug } });
  });

  revalidatePath('/');
  revalidatePath('/submit');
  redirect(`/r/${slug}`);
}

export async function setCommunityMembershipAction(slug: string, shouldJoin: boolean) {
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'Sign in to join a community.' };

  const communitySlug = slug.trim().toLowerCase();
  const community = await prisma.tag.findUnique({ where: { slug: communitySlug }, select: { slug: true, createdById: true } });
  if (!community) return { error: 'Community not found.' };

  if (!shouldJoin && community.createdById === userId) {
    return { error: 'Community owners cannot leave their community.' };
  }

  if (shouldJoin) {
    await prisma.communityMembership.upsert({
      where: { userId_communitySlug: { userId, communitySlug } },
      create: { userId, communitySlug },
      update: {},
    });
  } else {
    await prisma.communityMembership.deleteMany({ where: { userId, communitySlug } });
  }

  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${communitySlug}`);
  return { isMember: shouldJoin };
}

export async function updateCommunityAction(
  _previousState: CommunitySettingsFormState,
  formData: FormData,
): Promise<CommunitySettingsFormState> {
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'You must be signed in to manage a community.' };

  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const label = String(formData.get('label') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const hashColor = String(formData.get('hashColor') ?? '').trim();

  if (label.length < 3 || label.length > 60) return { error: 'Community name must be 3–60 characters.' };
  if (description.length > 500) return { error: 'Description must be 500 characters or fewer.' };
  if (!/^#[0-9a-f]{6}$/i.test(hashColor)) return { error: 'Choose a valid community color.' };

  const community = await prisma.tag.findUnique({ where: { slug }, select: { createdById: true } });
  if (!community) return { error: 'Community not found.' };
  if (community.createdById !== userId) return { error: 'Only the community owner can change these settings.' };

  await prisma.tag.update({ where: { slug }, data: { label, description, hashColor } });
  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/r/${slug}`);
  revalidatePath(`/r/${slug}/settings`);
  redirect(`/r/${slug}`);
}
