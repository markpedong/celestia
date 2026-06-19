'use server';

import { getCurrentUserID } from '../auth';
import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';

export async function setCommunityMembershipAction(slug: string, shouldJoin: boolean) {
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'Sign in to join a community.' };

  const communitySlug = slug.trim().toLowerCase();
  const community = await prisma.tag.findUnique({ where: { slug: communitySlug }, select: { slug: true } });
  if (!community) return { error: 'Community not found.' };

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
