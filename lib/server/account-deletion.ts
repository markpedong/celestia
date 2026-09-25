import 'server-only';

import { reconcileAccountDeletion, type DeletionOperations } from '@/lib/account-deletion';
import { prisma } from '@/lib/prisma';
import { invalidateFeedCache } from '@/lib/server/feed-cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { parsePublicFileUrl } from '@/lib/storage';
import type { Prisma } from '@/lib/generated/prisma/client';

type StorageBucket = 'profile-avatars' | 'profile-covers' | 'post-images';
type StoragePaths = Record<StorageBucket, string[]>;

const emptyPaths = (): StoragePaths => ({
  'profile-avatars': [],
  'profile-covers': [],
  'post-images': [],
});

const collectPaths = (userID: string, avatarUrl: string | null | undefined, coverUrl: string | null | undefined, postImages: string[][]) => {
  const paths = emptyPaths();
  const urls: { bucket: StorageBucket; url: string | null | undefined }[] = [
    { bucket: 'profile-avatars', url: avatarUrl },
    { bucket: 'profile-covers', url: coverUrl },
    ...postImages.flatMap(images => images.map(url => ({ bucket: 'post-images' as const, url }))),
  ];
  for (const { bucket, url } of urls) {
    if (!url) continue;
    const file = parsePublicFileUrl(url);
    if (file?.bucket === bucket && file.path.startsWith(`${userID}/`) && !paths[bucket].includes(file.path)) {
      paths[bucket].push(file.path);
    }
  }
  return paths;
};

/** Persist the request before calling an external service. Repeated requests reuse it. */
export const beginAccountDeletion = async (userID: string) => {
  const existing = await prisma.accountDeletion.findUnique({ where: { userID } });
  if (existing) return existing;

  const [profile, posts] = await Promise.all([
    prisma.users.findUnique({ where: { id: userID }, select: { avatarUrl: true, coverUrl: true } }),
    prisma.post.findMany({ where: { authorID: userID }, select: { imageUrls: true } }),
  ]);
  const storagePaths = collectPaths(userID, profile?.avatarUrl, profile?.coverUrl, posts.map(post => post.imageUrls));
  return prisma.accountDeletion.upsert({
    where: { userID },
    create: { userID, status: 'pending_auth', storagePaths: storagePaths as Prisma.InputJsonValue },
    update: {},
  });
};

const authUserExists = async (userID: string) => {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userID);
  if (error?.status === 404) return false;
  if (error) throw error;
  if (!data.user) throw new Error('Unable to verify Auth deletion.');
  return true;
};

const deleteAuthUser = async (userID: string) => {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userID);
  if (error) throw error;
};

/** Commit the application cleanup and transition together, or roll back both. */
const cleanupApplicationData = async (userID: string) => {
  await prisma.$transaction(async tx => {
    const posts = await tx.post.findMany({ where: { authorID: userID }, select: { id: true, imageUrls: true } });
    const postIDs = posts.map(post => post.id);
    const [comments, profile, pending] = await Promise.all([
      tx.comment.findMany({
        where: { OR: [{ authorID: userID }, ...(postIDs.length ? [{ postID: { in: postIDs } }] : [])] },
        select: { id: true },
      }),
      tx.users.findUnique({ where: { id: userID }, select: { avatarUrl: true, coverUrl: true } }),
      tx.accountDeletion.findUnique({ where: { userID }, select: { storagePaths: true } }),
    ]);
    const commentIDs = comments.map(comment => comment.id);
    // Include any media created while Auth deletion was temporarily unavailable.
    const paths = collectPaths(userID, profile?.avatarUrl, profile?.coverUrl, posts.map(post => post.imageUrls));
    const prior = pending?.storagePaths;
    if (prior && typeof prior === 'object' && !Array.isArray(prior)) {
      for (const bucket of ['profile-avatars', 'profile-covers', 'post-images'] as const) {
        const previous = prior[bucket];
        if (!Array.isArray(previous)) continue;
        for (const path of previous) {
          if (typeof path === 'string' && path.startsWith(`${userID}/`) && !paths[bucket].includes(path)) paths[bucket].push(path);
        }
      }
    }
    const targets = [
      ...(postIDs.length ? [{ targetType: 'post', targetID: { in: postIDs } }] : []),
      ...(commentIDs.length ? [{ targetType: 'comment', targetID: { in: commentIDs } }] : []),
    ];
    await tx.backupCode.deleteMany({ where: { userID } });
    await tx.notification.deleteMany({ where: { OR: [{ userID }, { actorID: userID }] } });
    await tx.report.deleteMany({
      where: { OR: [{ reporterID: userID }, { reviewedByID: userID }, { targetType: 'user', targetID: userID }, ...targets] },
    });
    await tx.contentAction.deleteMany({
      where: { OR: [{ userID }, { targetType: 'user', targetID: userID }, ...targets] },
    });
    await tx.vote.deleteMany({ where: { OR: [{ userID }, ...targets] } });
    await tx.communityMembers.deleteMany({ where: { userID } });
    await tx.chatParticipant.deleteMany({ where: { userID } });
    await tx.community.updateMany({ where: { createdByID: userID }, data: { createdByID: null } });
    await tx.comment.deleteMany({ where: { authorID: userID } });
    await tx.post.deleteMany({ where: { authorID: userID } });
    await tx.users.deleteMany({ where: { id: userID } });
    await tx.accountDeletion.update({
      where: { userID },
      data: { status: 'pending_storage', storagePaths: paths as Prisma.InputJsonValue },
    });
  });

  // Cache invalidation is not part of the cross-service transaction.
  try {
    await invalidateFeedCache();
  } catch {
    console.error('Feed cache invalidation failed after account deletion.');
  }
};

const cleanupStorage = async (userID: string) => {
  const record = await prisma.accountDeletion.findUnique({ where: { userID }, select: { storagePaths: true } });
  if (!record) return;
  const saved = record.storagePaths;
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid deletion storage manifest.');

  const admin = createSupabaseAdminClient();
  for (const bucket of ['profile-avatars', 'profile-covers', 'post-images'] as const) {
    const value = saved[bucket];
    if (!Array.isArray(value) || !value.every(path => typeof path === 'string' && path.startsWith(`${userID}/`))) {
      throw new Error('Invalid deletion storage manifest.');
    }
    const paths = value as string[];
    for (let offset = 0; offset < paths.length; offset += 100) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(offset, offset + 100));
      if (error) throw error;
    }
  }
};

const operations: DeletionOperations = {
  load: userID => prisma.accountDeletion.findUnique({ where: { userID }, select: { userID: true, status: true } })
    .then(record => record ? { userID: record.userID, status: record.status as 'pending_auth' | 'pending_cleanup' | 'pending_storage' } : null),
  authUserExists,
  deleteAuthUser,
  markAuthDeleted: async userID => {
    await prisma.accountDeletion.update({ where: { userID }, data: { status: 'pending_cleanup' } });
  },
  cleanupApplicationData,
  cleanupStorage,
  finish: async userID => {
    await prisma.accountDeletion.deleteMany({ where: { userID } });
  },
};

export const processAccountDeletion = (userID: string) => reconcileAccountDeletion(userID, operations);

export const getAccountDeletionStatus = async (userID: string) =>
  prisma.accountDeletion.findUnique({ where: { userID }, select: { status: true } });

export const reconcilePendingAccountDeletions = async (limit = 10) => {
  const pending = await prisma.accountDeletion.findMany({
    where: { status: { in: ['pending_auth', 'pending_cleanup', 'pending_storage'] } },
    orderBy: { requestedAt: 'asc' },
    select: { userID: true, status: true },
    take: limit,
  });
  let completed = 0;
  let failed = 0;
  for (const record of pending) {
    try {
      await processAccountDeletion(record.userID);
      completed += 1;
    } catch {
      failed += 1;
      // Do not log credentials, user identifiers, or raw external error objects.
      console.error('Account deletion reconciliation failed.', { stage: record.status });
    }
  }
  return { attempted: pending.length, completed, failed };
};
