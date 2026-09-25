'use server';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getSessionUser } from '../auth';
import { prisma } from '../prisma';
import { createSupabaseAdminClient, createSupabaseServerClient } from '../supabase/server';
import { beginAccountDeletion, getAccountDeletionStatus, processAccountDeletion } from '../server/account-deletion';
import { resetFactorsWithBackupCode } from '../backup-code-recovery';
import { checkRateLimit } from '../server/rate-limit';
import type { ChangePasswordValues, ErrorFormState } from '../types';
import { deleteAccountSchema, setPasswordSchema } from '../form-schemas';

type SecurityActionState = ErrorFormState<{ success?: string; codes?: string[]; remainingCodes?: number; recoveryRequired?: boolean }>;
type BackupCodeStatusState = ErrorFormState<{ hasBackupCodes?: boolean }>;
type SensitiveSetting = 'email' | 'phone' | 'gender' | 'location';
type PasswordVerificationSetting = SensitiveSetting | 'passkey' | 'mfa' | 'backupCodes';
type PasswordVerificationState = ErrorFormState<{ success?: string; setting?: PasswordVerificationSetting; token?: string }>;

const sensitiveSettings = new Set<SensitiveSetting>(['email', 'phone', 'gender', 'location']);
const passwordProtectedSettings = new Set<PasswordVerificationSetting>(['email', 'phone', 'gender', 'location', 'passkey', 'mfa', 'backupCodes']);
const verificationLifetime = 5 * 60 * 1000;

const hasAccountPassword = (appMetadata: Record<string, unknown> | undefined, identities?: { provider?: string }[]) =>
  appMetadata?.has_password === true ||
  identities?.some(identity => identity.provider === 'email') === true ||
  appMetadata?.providers instanceof Array && appMetadata.providers.includes('email');

const normalizeCode = (code: string) => code.trim().replace(/\s+/g, '').toUpperCase();
const hashCode = (code: string) => createHash('sha256').update(normalizeCode(code)).digest('hex');
const makeCode = () => randomBytes(9).toString('base64url').toUpperCase();

const verificationSecret = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

const createVerificationToken = (userID: string, setting: PasswordVerificationSetting) => {
  const secret = verificationSecret();
  if (!secret) throw new Error('Password verification is not configured.');
  const payload = Buffer.from(JSON.stringify({ userID, setting, expiresAt: Date.now() + verificationLifetime })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
};

const verifyVerificationToken = (token: string, userID: string, setting: PasswordVerificationSetting) => {
  const secret = verificationSecret();
  const [payload, signature] = token.split('.');
  if (!secret || !payload || !signature) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userID?: string; setting?: string; expiresAt?: number };
    return data.userID === userID && data.setting === setting && typeof data.expiresAt === 'number' && data.expiresAt > Date.now();
  } catch { return false; }
};

const verifyCurrentPassword = async (password: string) => {
  const user = await getSessionUser();
  if (!user) return { error: 'A password is not available for this account.' as const };
  const passwordVerifier = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
  const { data, error } = await passwordVerifier.auth.signInWithPassword({ email: user.email, password });
  if (error || data.user?.id !== user.id) return { error: 'Your current password is incorrect.' as const };
  return { user };
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
  const nextValue = value.trim();

  if (setting === 'email') {
    if (!/^\S+@\S+\.\S+$/.test(nextValue)) return { error: 'Enter a valid email address.' };
    if (user.email?.trim().toLowerCase() === nextValue.toLowerCase()) return { error: 'Enter a different email address.' };
  }

  const attributes = setting === 'email' ? { email: nextValue } : setting === 'phone' ? { phone: nextValue } : { data: { [setting]: nextValue } };
  const { error } = await supabase.auth.updateUser(attributes);
  if (error) return { error: error.message };
  revalidatePath('/settings');
  return { success: setting === 'email' ? 'Check your inbox to confirm your new email.' : 'Account details updated.' };
};

export const changePasswordAction = async (values: ChangePasswordValues): Promise<ErrorFormState<{ success?: string }>> => {
  const { currentPassword, newPassword } = values;
  const verification = await verifyCurrentPassword(currentPassword);
  if ('error' in verification) return verification;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
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
  const hasPassword = hasAccountPassword(user.app_metadata, user.identities);
  if (hasPassword) return { error: 'A password is already set. Use Change Password instead.' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  const admin = createSupabaseAdminClient();
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, has_password: true },
  });
  if (metadataError) return { error: `Password was set, but the account status could not be saved: ${metadataError.message}` };

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
  const client = await createSupabaseServerClient();
  const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error || assurance.data.currentLevel !== 'aal2') {
    return { error: 'Verify your authenticator and enable MFA before generating backup codes.' };
  }
  const codes = Array.from({ length: 10 }, makeCode);
  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userID: user.id } }),
    prisma.backupCode.createMany({ data: codes.map(code => ({ userID: user.id, codeHash: hashCode(code) })) }),
  ]);
  revalidatePath('/settings');
  return { success: 'New backup codes generated. Save them now; they will not be shown again.', codes };
};

export const getBackupCodeStatusAction = async (): Promise<BackupCodeStatusState> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Sign in before checking backup codes.' };

  const count = await prisma.backupCode.count({
    where: {
      userID: user.id,
      usedAt: null,
    },
  });

  return { hasBackupCodes: count > 0 };
};

export const verifyBackupCodeAction = async (code: string): Promise<SecurityActionState> => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return { error: 'Enter a backup code.' };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: 'Sign in before using a backup code.' };
  if (!await checkRateLimit(`backup-recovery:${user.id}`, 8, 600, { failOpen: false })) {
    return { error: 'Too many recovery attempts. Please try again later.' };
  }

  const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance.error) return { error: 'Unable to check your authenticator. Try again later.' };
  if (assurance.data.nextLevel !== 'aal2' || assurance.data.currentLevel === 'aal2') {
    return { error: 'Recovery is not needed for this session.' };
  }

  const factors = await supabase.auth.mfa.listFactors();
  if (factors.error) return { error: 'Unable to list your authenticators. Try again later.' };
  const verifiedFactorIDs = factors.data.all
    .filter(factor => factor.status === 'verified' && (factor.factor_type === 'totp' || factor.factor_type === 'phone'))
    .map(factor => factor.id);
  if (verifiedFactorIDs.length === 0) return { error: 'There is no verified authenticator to recover.' };

  const backupCode = await prisma.backupCode.findFirst({
    where: { userID: user.id, codeHash: hashCode(normalizedCode), usedAt: null },
    select: { id: true },
  });
  if (!backupCode) return { error: 'That backup code is invalid or has already been used.' };

  const usedAt = new Date();
  const admin = createSupabaseAdminClient();
  try {
    const result = await resetFactorsWithBackupCode(verifiedFactorIDs, {
      claimCode: async () => {
        const claimed = await prisma.backupCode.updateMany({
          where: { id: backupCode.id, userID: user.id, usedAt: null },
          data: { usedAt },
        });
        return claimed.count === 1;
      },
      restoreCode: async () => {
        await prisma.backupCode.updateMany({
          where: { id: backupCode.id, userID: user.id, usedAt },
          data: { usedAt: null },
        });
      },
      removeVerifiedFactor: async id => {
        const { error: removalError } = await admin.auth.admin.mfa.deleteFactor({ id, userId: user.id });
        if (removalError) throw removalError;
      },
      invalidateRemainingCodes: async () => {
        await prisma.backupCode.deleteMany({ where: { userID: user.id } });
      },
    });

    if (result === 'invalid') return { error: 'That backup code was already used. Try another code.' };
    if (result === 'recovered_with_stale_codes') {
      console.error('MFA factors reset, but legacy backup codes need manual cleanup.');
    }
    revalidatePath('/settings');
    return {
      success: result === 'recovered_with_stale_codes'
        ? 'Authenticator reset. Sign in again, enroll a new authenticator, and replace your old recovery codes immediately.'
        : 'Authenticator reset. Sign in again and set up a new authenticator and backup codes.',
      remainingCodes: 0,
      recoveryRequired: true,
    };
  } catch {
    console.error('Legacy backup-code factor recovery failed.');
    return { error: 'Recovery could not finish. If you were signed out, sign in again and retry with the same code or contact support.' };
  }
};

export const deleteAccountAction = async (_prev: SecurityActionState, { confirmation }: { confirmation: string }): Promise<SecurityActionState> => {
  void _prev;
  const parsed = deleteAccountSchema.safeParse({ confirmation });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Type DELETE to confirm account deletion.' };
  const user = await getSessionUser();
  if (!user) return { error: 'You must be signed in to delete your account.' };

  try {
    // Save the request and storage manifest first; no app data is deleted until
    // Supabase confirms Auth deletion. A protected reconciler retries crashes.
    await beginAccountDeletion(user.id);
    const outcome = await processAccountDeletion(user.id);
    if (outcome === 'busy') {
      return { error: 'Your account deletion is already processing. Please wait for it to complete or retry later.' };
    }
    revalidatePath('/', 'layout');
    return { success: 'Account deleted.' };
  } catch {
    const pending = await getAccountDeletionStatus(user.id).catch(() => null);
    console.error('Account deletion requires reconciliation.', { stage: pending?.status ?? 'request' });
    if (pending?.status === 'pending_cleanup' || pending?.status === 'pending_storage') {
      revalidatePath('/', 'layout');
      return { success: 'Your sign-in account was removed. Remaining data cleanup is queued for retry.' };
    }
    return { error: pending
      ? 'Your deletion request is saved for automatic retry, but could not finish yet. Your application data remains intact until Auth removal is confirmed. You can retry here or contact support.'
      : 'Unable to start account deletion. Please try again.' };
  }
};
