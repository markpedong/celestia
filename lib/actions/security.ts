'use server';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { prisma } from '../prisma';
import { createSupabaseAdminClient, createSupabaseServerClient } from '../supabase/server';
import type { ErrorFormState } from '../types';

type SecurityActionState = ErrorFormState<{ success?: string; codes?: string[] }>;
type SensitiveSetting = 'email' | 'phone' | 'gender' | 'location';
type PasswordVerificationState = ErrorFormState<{ success?: string; setting?: SensitiveSetting; token?: string }>;

const sensitiveSettings = new Set<SensitiveSetting>(['email', 'phone', 'gender', 'location']);
const verificationLifetime = 5 * 60 * 1000;

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');
const makeCode = () => randomBytes(9).toString('base64url').toUpperCase();

const verificationSecret = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const createVerificationToken = (userId: string, setting: SensitiveSetting) => {
  const secret = verificationSecret();
  if (!secret) throw new Error('Password verification is not configured.');
  const payload = Buffer.from(JSON.stringify({ userId, setting, expiresAt: Date.now() + verificationLifetime })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
};

const verifyVerificationToken = (token: string, userId: string, setting: SensitiveSetting) => {
  const secret = verificationSecret();
  const [payload, signature] = token.split('.');
  if (!secret || !payload || !signature) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: string; setting?: string; expiresAt?: number };
    return data.userId === userId && data.setting === setting && typeof data.expiresAt === 'number' && data.expiresAt > Date.now();
  } catch { return false; }
};

const verifyCurrentPassword = async (password: string) => {
  const user = await getSessionUser();
  if (!user?.email) return { error: 'A password is not available for this account.' as const };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (error || data.user?.id !== user.id) return { error: 'Your current password is incorrect.' as const };
  return { user, supabase };
};

export const verifyAccountPasswordAction = async (formData: FormData): Promise<PasswordVerificationState> => {
  const setting = formData.get('setting');
  const password = formData.get('password');
  if (typeof setting !== 'string' || !sensitiveSettings.has(setting as SensitiveSetting)) return { error: 'Choose a valid account setting.' };
  if (typeof password !== 'string' || !password) return { error: 'Enter your password.' };
  const verification = await verifyCurrentPassword(password);
  if ('error' in verification) return verification;
  return { success: 'Password verified.', setting: setting as SensitiveSetting, token: createVerificationToken(verification.user.id, setting as SensitiveSetting) };
};

export const updateSensitiveAccountAction = async (formData: FormData): Promise<ErrorFormState<{ success?: string }>> => {
  const setting = formData.get('setting');
  const token = formData.get('verificationToken');
  const value = formData.get('value');
  if (typeof setting !== 'string' || !sensitiveSettings.has(setting as SensitiveSetting) || typeof token !== 'string' || typeof value !== 'string') return { error: 'Invalid account update.' };
  const user = await getSessionUser();
  if (!user || !verifyVerificationToken(token, user.id, setting as SensitiveSetting)) return { error: 'Verify your password again before making this change.' };
  const supabase = await createSupabaseServerClient();
  const attributes = setting === 'email' ? { email: value.trim() } : setting === 'phone' ? { phone: value.trim() } : { data: { [setting]: value.trim() } };
  const { error } = await supabase.auth.updateUser(attributes);
  if (error) return { error: error.message };
  revalidatePath('/settings');
  return { success: setting === 'email' ? 'Check your inbox to confirm your new email.' : 'Account details updated.' };
};

export const changePasswordAction = async (formData: FormData): Promise<ErrorFormState<{ success?: string }>> => {
  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');
  if (typeof currentPassword !== 'string' || !currentPassword) return { error: 'Enter your current password.' };
  if (typeof newPassword !== 'string' || newPassword.length < 6) return { error: 'Your new password must be at least 6 characters.' };
  if (newPassword !== confirmPassword) return { error: 'New passwords do not match.' };
  const verification = await verifyCurrentPassword(currentPassword);
  if ('error' in verification) return verification;
  const { error } = await verification.supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: 'Password updated.' };
};

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
