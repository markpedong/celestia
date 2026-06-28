'use client';

import { useActionState, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, KeyRound, Link2, Moon, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
import { deleteAccountAction } from '@/lib/actions/security';
import {
  BackupCodesDialogDynamic,
  ChangePasswordDialogDynamic,
  DeleteAccountDialogDynamic,
  MfaDialogDynamic,
  SensitiveSettingDialogDynamic,
  SetPasswordDialogDynamic,
  VerifyPasswordDialogDynamic,
} from '@/components/dynamic-import';
import { AccountDialog, SensitiveSetting } from '@/lib/types';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className='celestia-card space-y-5 p-5 md:p-6'>
    <h2 className='text-base font-semibold'>{title}</h2>
    {children}
  </section>
);

export const AccountSettings = () => {
  const { supabase, user } = useSession();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<AccountDialog>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [hasPasswordOverride, setHasPasswordOverride] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [deleteState, deleteAccount, deletingAccount] = useActionState(deleteAccountAction, null);

  const identities = user?.identities ?? [];
  const hasProvider = (provider: 'google' | 'apple') => identities.some(identity => identity.provider === provider);
  const hasOAuthProvider = identities.some(identity => identity.provider !== 'email');

  // OAuth identities stay OAuth identities after a password is added. The
  // server-owned flag is therefore the reliable source for linked accounts.
  const hasPassword =
    hasPasswordOverride ||
    user?.app_metadata.has_password === true ||
    identities.some(identity => identity.provider === 'email') ||
    (Array.isArray(user?.app_metadata.providers) && user.app_metadata.providers.includes('email'));
  const hasPasskeyFallbackSignIn = hasPassword || hasOAuthProvider;
  const isCancelledAuthError = (error: unknown) => {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    return /cancel|abort|not allowed|timed out/i.test(message);
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error('Unable to copy to clipboard.');
    }
  };

  const openPasswordProtectedSetting = (setting: SensitiveSetting) => {
    if (!hasPassword) {
      toast.error('Set a password first before changing this setting.');
      return;
    }

    setDialog({ type: 'verify', setting });
  };

  const securityQuery = useQuery({
    queryKey: ['auth', 'security', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [passkeyResult, factorResult] = await Promise.all([
        supabase.auth.passkey.list(),
        supabase.auth.mfa.listFactors(),
      ]);

      if (passkeyResult.error) throw passkeyResult.error;
      if (factorResult.error) throw factorResult.error;

      return {
        passkeys: passkeyResult.data ?? [],
        factors: factorResult.data.totp,
        pendingTotpFactors: factorResult.data.all.filter(
          factor => factor.factor_type === 'totp' && factor.status === 'unverified'
        ),
      };
    },
  });

  const passkeys = securityQuery.data?.passkeys ?? [];
  const factors = securityQuery.data?.factors ?? [];
  const pendingTotpFactors = securityQuery.data?.pendingTotpFactors ?? [];
  const refreshSecurity = () => queryClient.invalidateQueries({ queryKey: ['auth', 'security', user?.id] });

  const hasAal2Session = async () => {
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) {
      toast.error(assurance.error.message);
      return false;
    }

    if (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
      toast.error('Verify your two-factor code again before managing passkeys.');
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (securityQuery.error) toast.error(securityQuery.error.message);
  }, [securityQuery.error]);

  useEffect(() => {
    if (deleteState?.error) toast.error(deleteState.error);
    if (deleteState?.success) void supabase.auth.signOut().then(() => window.location.assign('/'));
  }, [deleteState, supabase]);

  const changeProvider = async (provider: 'google' | 'apple') => {
    const identity = identities.find(item => item.provider === provider);
    const hasAnotherOAuthProvider = identities.some(item => item.provider !== provider);

    if (identity && !hasAnotherOAuthProvider) {
      toast.error('Link another sign-in provider before disconnecting this one.');
      return;
    }

    setPending(provider);

    const result = identity
      ? await supabase.auth.unlinkIdentity(identity)
      : await supabase.auth.linkIdentity({
          provider,
          options: { redirectTo: `${window.location.origin}/auth/callback?next=/settings` },
        });

    setPending(null);

    if (result.error) toast.error(result.error.message);
    else if (identity) toast.success(`${provider === 'google' ? 'Google' : 'Apple'} disconnected.`);
  };

  const registerPasskey = async () => {
    if (!(await hasAal2Session())) return;

    setPending('passkey');

    const { error } = await supabase.auth.registerPasskey();

    setPending(null);

    if (error) {
      if (!isCancelledAuthError(error)) toast.error(error.message);
    }
    else {
      toast.success('Passkey added.');
      await refreshSecurity();
    }
  };

  const removePasskey = async (passkeyID: string) => {
    if (!(await hasAal2Session())) return;

    if (passkeys.length === 1 && !hasPasskeyFallbackSignIn) {
      toast.error('Add another sign-in method before removing your last passkey.');
      return;
    }

    setPending(passkeyID);

    const { error } = await supabase.auth.passkey.delete({ passkeyId: passkeyID });

    setPending(null);

    if (error) toast.error(error.message);
    else {
      toast.success('Passkey removed.');
      await refreshSecurity();
    }
  };

  const removeAllPasskeys = async () => {
    if (!(await hasAal2Session()) || passkeys.length === 0) return;

    if (!hasPasskeyFallbackSignIn) {
      toast.error('Add another sign-in method before revoking all passkeys.');
      return;
    }

    setPending('passkeys-all');

    const results = await Promise.all(passkeys.map(passkey => supabase.auth.passkey.delete({ passkeyId: passkey.id })));
    const firstError = results.find(result => result.error)?.error;

    setPending(null);

    if (firstError) {
      toast.error(firstError.message);
      await refreshSecurity();
      return;
    }

    toast.success('All passkeys revoked.');
    await refreshSecurity();
  };

  const enrollMfa = async () => {
    setPending('mfa-enroll');

    const pendingFactor = pendingTotpFactors.find(factor => factor.friendly_name === 'Authenticator app');

    if (pendingFactor) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: pendingFactor.id });

      if (error) {
        setPending(null);
        toast.error(error.message);
        return;
      }
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator app',
    });

    setPending(null);

    if (error || !data?.totp) {
      toast.error(error?.message ?? 'Unable to start MFA enrollment.');
      return;
    }

    setEnrollment({
      id: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    });
  };

  const verifyMfa = async () => {
    if (!enrollment || !mfaCode) return;

    setPending('mfa-verify');

    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.id });
    const result = challenge.error
      ? challenge
      : await supabase.auth.mfa.verify({
          factorId: enrollment.id,
          challengeId: challenge.data.id,
          code: mfaCode,
        });

    setPending(null);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success('Two-factor authentication enabled.');
    setEnrollment(null);
    setMfaCode('');
    setDialog(null);
    await refreshSecurity();
  };

  const cancelMfaEnrollment = async () => {
    if (!enrollment) {
      setDialog(null);
      return;
    }

    setPending('mfa-cancel');

    const { error } = await supabase.auth.mfa.unenroll({ factorId: enrollment.id });

    setPending(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEnrollment(null);
    setMfaCode('');
    setDialog(null);
    await refreshSecurity();
  };

  const disableMfa = async (factorID: string) => {
    setPending(factorID);

    const { error } = await supabase.auth.mfa.unenroll({ factorId: factorID });

    setPending(null);

    if (error) toast.error(error.message);
    else {
      toast.success('Two-factor authentication disabled.');
      await refreshSecurity();
    }
  };

  return (
    <div className='space-y-5'>
      <Section title='General'>
        <div className='divide-y divide-border rounded-lg border border-border'>
          <SettingsOptionRow
            title='Change email'
            value={user?.email}
            onClick={() => openPasswordProtectedSetting('email')}
          />
          <SettingsOptionRow
            title='Phone Number'
            value={user?.phone || 'Not set'}
            onClick={() => openPasswordProtectedSetting('phone')}
          />
          <SettingsOptionRow
            title={hasPassword ? 'Change Password' : 'Set Password'}
            description={hasPassword ? 'Update your account password.' : 'Add a password to sign in without Google.'}
            onClick={() => setDialog({ type: hasPassword ? 'changePassword' : 'setPassword' })}
          />
          <SettingsOptionRow
            title='Location'
            value={
              typeof user?.user_metadata.location === 'string' ? user.user_metadata.location || 'Not set' : 'Not set'
            }
            onClick={() => openPasswordProtectedSetting('location')}
          />
          <SettingsOptionRow
            title='Gender'
            value={typeof user?.user_metadata.gender === 'string' ? user.user_metadata.gender || 'Not set' : 'Not set'}
            onClick={() => openPasswordProtectedSetting('gender')}
          />
        </div>
      </Section>

      <Section title='Account Authorization'>
        {(['google', 'apple'] as const).map(provider => {
          const label = provider === 'google' ? 'Google' : 'Apple';
          const connected = hasProvider(provider);
          const canDisconnect = !connected || identities.some(identity => identity.provider !== provider);

          return (
            <div key={provider} className='flex items-center justify-between gap-3 rounded-md border border-border p-3'>
              <span className='flex items-center gap-2 text-sm'>
                <Link2 className='size-4 text-muted-foreground' /> {label} {connected ? 'connected' : 'not connected'}
              </span>
              <Button
                size='sm'
                variant='outline'
                onClick={() => void changeProvider(provider)}
                isLoading={pending === provider}
                disabled={connected && !canDisconnect}
                title={connected && !canDisconnect ? 'Link another sign-in provider before disconnecting this one.' : undefined}
              >
                {connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          );
        })}

        <div className='space-y-2 rounded-md border border-border p-3'>
          <div className='flex items-center justify-between gap-3'>
            <span className='flex items-center gap-2 text-sm'>
              <KeyRound className='size-4 text-muted-foreground' /> Passkeys
            </span>
            <Button
              size='sm'
              variant='outline'
              onClick={() => openPasswordProtectedSetting('passkey')}
              isLoading={pending === 'passkey'}
            >
              Add passkey
            </Button>
          </div>

          {passkeys.map(passkey => (
            <div key={passkey.id} className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
              <span>
                {passkey.friendly_name ?? 'Passkey'} · added {new Date(passkey.created_at).toLocaleDateString()}
              </span>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => void removePasskey(passkey.id)}
                isLoading={pending === passkey.id}
              >
                Remove
              </Button>
            </div>
          ))}
          {passkeys.length > 0 ? (
            <div className='flex justify-end'>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => void removeAllPasskeys()}
                isLoading={pending === 'passkeys-all'}
                disabled={!hasPasskeyFallbackSignIn}
              >
                Revoke all passkeys
              </Button>
            </div>
          ) : null}
        </div>

        <div className='space-y-3 rounded-md border border-border p-3'>
          <div className='flex items-center justify-between gap-3'>
            <span className='flex items-center gap-2 text-sm'>
              <ShieldCheck className='size-4 text-muted-foreground' /> Two-Factor Authentication
            </span>
            {factors.length ? null : (
              <Button
                size='sm'
                variant='outline'
                onClick={() => openPasswordProtectedSetting('mfa')}
                isLoading={pending === 'mfa-enroll'}
              >
                Set up
              </Button>
            )}
          </div>

          {factors.map(factor => (
            <div key={factor.id} className='flex items-center justify-between gap-3 text-xs text-muted-foreground'>
              <span>{factor.friendly_name ?? 'Authenticator app'} enabled</span>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => void disableMfa(factor.id)}
                isLoading={pending === factor.id}
              >
                Disable
              </Button>
            </div>
          ))}
        </div>

        <div className='space-y-3 rounded-md border border-border p-3'>
          <div className='flex items-center justify-between gap-3'>
            <span className='flex items-center gap-2 text-sm'>
              <Smartphone className='size-4 text-muted-foreground' /> Backup Codes
            </span>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => openPasswordProtectedSetting('backupCodes')}
            >
              {backupCodes ? 'Regenerate' : 'Generate'}
            </Button>
          </div>

          <p className='text-xs text-muted-foreground'>Generate one-time codes to store somewhere safe.</p>

          {backupCodes ? (
            <div className='space-y-2'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  size='sm'
                  variant='ghost'
                  onClick={() => void copyText(backupCodes.join('\n'), 'Backup codes copied.')}
                >
                  <Copy /> Copy all
                </Button>
              </div>
              <div className='rounded bg-muted p-3 font-mono text-xs leading-6'>
                {backupCodes.map(code => (
                  <div key={code} className='flex items-center justify-between gap-3'>
                    <span>{code}</span>
                    <Button
                      type='button'
                      size='icon-xs'
                      variant='ghost'
                      aria-label={`Copy backup code ${code}`}
                      onClick={() => void copyText(code, 'Backup code copied.')}
                    >
                      <Copy />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      <Section title='Apps'>
        <div className='flex items-center justify-between gap-3'>
          <span className='flex items-center gap-2 text-sm'>
            <Moon className='size-4 text-muted-foreground' /> Dark Mode
          </span>
          <Button variant='outline' size='sm' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            Toggle
          </Button>
        </div>
      </Section>

      <Section title='Advanced'>
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/35 bg-destructive/5 p-3'>
          <div>
            <p className='text-sm font-medium'>Delete Account</p>
            <p className='text-xs text-muted-foreground'>This permanently removes your account and data.</p>
          </div>
          <Button variant='destructive' size='sm' onClick={() => setDialog({ type: 'deleteAccount' })}>
            <Trash2 /> Delete account
          </Button>
        </div>
      </Section>

      {dialog?.type === 'verify' ? (
        <VerifyPasswordDialogDynamic
          setting={dialog.setting}
          onCloseAction={() => setDialog(null)}
          onVerifiedAction={async result => {
            if (result.setting === 'passkey') {
              setDialog(null);
              await registerPasskey();
              return;
            }

            if (result.setting === 'mfa') {
              setDialog({ type: 'mfa' });
              await enrollMfa();
              return;
            }

            if (result.setting === 'backupCodes') {
              setDialog({ type: 'backupCodes' });
              return;
            }

            setDialog({ type: 'edit', setting: result.setting, token: result.token });
          }}
        />
      ) : null}

      {dialog?.type === 'edit' ? (
        <SensitiveSettingDialogDynamic dialog={dialog} user={user ?? null} onCloseAction={() => setDialog(null)} />
      ) : null}

      {dialog?.type === 'changePassword' ? (
        <ChangePasswordDialogDynamic open onCloseAction={() => setDialog(null)} />
      ) : null}

      {dialog?.type === 'setPassword' ? (
        <SetPasswordDialogDynamic
          open
          onCloseAction={() => setDialog(null)}
          onSuccessAction={async () => {
            setHasPasswordOverride(true);
            await supabase.auth.refreshSession();
          }}
        />
      ) : null}

      {dialog?.type === 'mfa' ? (
        <MfaDialogDynamic
          open
          enrollment={enrollment}
          code={mfaCode}
          pending={pending}
          onCodeChangeAction={setMfaCode}
          onVerifiedAction={() => void verifyMfa()}
          onCancelAction={() => void cancelMfaEnrollment()}
        />
      ) : null}

      {dialog?.type === 'backupCodes' ? (
        <BackupCodesDialogDynamic
          open
          hasCodes={Boolean(backupCodes)}
          onCloseAction={() => setDialog(null)}
          onGeneratedAction={codes => {
            setBackupCodes(codes);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog?.type === 'deleteAccount' ? (
        <DeleteAccountDialogDynamic
          open
          onCloseAction={() => setDialog(null)}
          action={deleteAccount}
          pending={deletingAccount}
        />
      ) : null}
    </div>
  );
};
