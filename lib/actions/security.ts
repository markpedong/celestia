'use server';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { prisma } from '../prisma';
import { createSupabaseAdminClient, createSupabaseServerClient } from '../supabase/server';
import type { ChangePasswordValues, ErrorFormState } from '../types';
import { deleteAccountSchema, setPasswordSchema } from '../form-schemas';

type SecurityActionState = ErrorFormState<{ success?: string; codes?: string[] }>;
type SensitiveSetting = 'email' | 'phone' | 'gender' | 'location';
type PasswordVerificationSetting = SensitiveSetting | 'passkey' | 'mfa' | 'backupCodes';
type PasswordVerificationState = ErrorFormState<{ success?: string; setting?: PasswordVerificationSetting; token?: string }>;

const sensitiveSettings = new Set<SensitiveSetting>(['email', 'phone', 'gender', 'location']);
const passwordProtectedSettings = new Set<PasswordVerificationSetting>(['email', 'phone', 'gender', 'location', 'passkey', 'mfa', 'backupCodes']);
const verificationLifetime = 5 * 60 * 1000;

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');
const makeCode = () => randomBytes(9).toString('base64url').toUpperCase();

const verificationSecret = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const createVerificationToken = (userId: string, setting: PasswordVerificationSetting) => {
  const secret = verificationSecret();
  if (!secret) throw new Error('Password verification is not configured.');
  const payload = Buffer.from(JSON.stringify({ userId, setting, expiresAt: Date.now() + verificationLifetime })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
};

const verifyVerificationToken = (token: string, userId: string, setting: PasswordVerificationSetting) => {
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
  if (!user) return { error: 'A password is not available for this account.' as const };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: user.email, password });
  if (error || data.user?.id !== user.id) return { error: 'Your current password is incorrect.' as const };
  return { user, supabase };
};

export const verifyAccountPasswordAction = async ({ password, setting }: { password: string; setting: PasswordVerificationSetting }): Promise<PasswordVerificationState> => {

  if (!passwordProtectedSettings.has(setting)) {
    return { error: 'Choose a valid account setting.' };
  }

  const verification = await verifyCurrentPassword(password.trim());

  if ('error' in verification) {
    return verification;
  }

  return {
    success: 'Password verified.',
    setting,
    token: createVerificationToken(verification.user.id, setting),
  };
};

export const updateSensitiveAccountAction = async ({ setting, token, value }: { setting: SensitiveSetting; token: string; value: string }): Promise<ErrorFormState<{ success?: string }>> => {
  if (!sensitiveSettings.has(setting) || !token) return { error: 'Invalid account update.' };
  const user = await getSessionUser();
  if (!user || !verifyVerificationToken(token, user.id, setting as SensitiveSetting)) return { error: 'Verify your password again before making this change.' };
  const supabase = await createSupabaseServerClient();
  const attributes = setting === 'email' ? { email: value.trim() } : setting === 'phone' ? { phone: value.trim() } : { data: { [setting]: value.trim() } };
  const { error } = await supabase.auth.updateUser(attributes);
  if (error) return { error: error.message };
  revalidatePath('/settings');
  return { success: setting === 'email' ? 'Check your inbox to confirm your new email.' : 'Account details updated.' };
};

export const changePasswordAction = async (values: ChangePasswordValues): Promise<ErrorFormState<{ success?: string }>> => {
  const { currentPassword, newPassword } = values;
  const verification = await verifyCurrentPassword(currentPassword);
  if ('error' in verification) return verification;
  const { error } = await verification.supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: 'Password updated.' };
};

export const setPasswordAction = async (values: { newPassword: string; confirmPassword: string }): Promise<ErrorFormState<{ success?: string }>> => {
  const parsed = setPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your new password.' };
  const { newPassword } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'You must be signed in to set a password.' };
  const hasPassword = user.identities?.some(identity => identity.provider === 'email') || user.app_metadata.providers?.includes('email');
  if (hasPassword) return { error: 'A password is already set. Use Change Password instead.' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: 'Password set. You can now sign in with email and password.' };
};

export const updateRecoveredPasswordAction = async (values: { newPassword: string; confirmPassword: string }): Promise<ErrorFormState<{ success?: string }>> => {
  const parsed = setPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check your new password.' };
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'Your reset link has expired. Request a new one and try again.' };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  return error ? { error: error.message } : { success: 'Password updated.' };
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

export const deleteAccountAction = async (_prev: SecurityActionState, { confirmation }: { confirmation: string }): Promise<SecurityActionState> => {
  void _prev;
  const parsed = deleteAccountSchema.safeParse({ confirmation });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Type DELETE to confirm account deletion.' };
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
