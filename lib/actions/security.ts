'use server';

import { createHash, randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { prisma } from '../prisma';
import { createSupabaseAdminClient } from '../supabase/server';
import type { ErrorFormState } from '../types';

type SecurityActionState = ErrorFormState<{ success?: string; codes?: string[] }>;

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');
const makeCode = () => randomBytes(9).toString('base64url').toUpperCase();

export const generateBackupCodesAction = async (): Promise<SecurityActionState> => {
  const user = await getSessionUser();
  if (!user) return { error: 'You must be signed in to generate backup codes.' };
  const codes = Array.from({ length: 10 }, makeCode);
  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
    prisma.backupCode.createMany({ data: codes.map(code => ({ userId: user.id, codeHash: hashCode(code) })) }),
  ]);
  revalidatePath('/settings');
  return { success: 'New backup codes generated. Save them now; they will not be shown again.', codes };
};

export const deleteAccountAction = async (_prev: SecurityActionState, formData: FormData): Promise<SecurityActionState> => {
  if (formData.get('confirmation') !== 'DELETE') return { error: 'Type DELETE to confirm account deletion.' };
  const user = await getSessionUser();
  if (!user) return { error: 'You must be signed in to delete your account.' };
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };
  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
    prisma.vote.deleteMany({ where: { userId: user.id } }),
    prisma.communityMembership.deleteMany({ where: { userId: user.id } }),
    prisma.comment.deleteMany({ where: { authorId: user.id } }),
    prisma.post.deleteMany({ where: { authorId: user.id } }),
    prisma.userProfile.deleteMany({ where: { id: user.id } }),
  ]);
  revalidatePath('/', 'layout');
  return { success: 'Account deleted.' };
};
