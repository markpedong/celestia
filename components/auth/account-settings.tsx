'use client';

import { useActionState, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Link2, Moon, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
import { deleteAccountAction } from '@/lib/actions/security';
import { VerifyPasswordDialog } from '../dialogs/verify-password';
import { SensitiveSettingDialog } from '../dialogs/sensitive-setting';
import { ChangePasswordDialog } from '../dialogs/change-password';
import { SetPasswordDialog } from '../dialogs/set-password';
import { MfaDialog } from '../dialogs/mfa-dialog';
import { BackupCodesDialog } from '../dialogs/backup-codes';
import { DeleteAccountDialog } from '../dialogs/delete-account';

type SensitiveSetting = 'email' | 'phone' | 'gender' | 'location' | 'passkey' | 'mfa' | 'backupCodes';
type EditableSetting = 'email' | 'phone' | 'gender' | 'location';

type AccountDialog =
  | { type: 'verify'; setting: SensitiveSetting }
  | { type: 'edit'; setting: EditableSetting; token: string }
  | { type: 'changePassword' }
  | { type: 'setPassword' }
  | { type: 'mfa' }
  | { type: 'backupCodes' }
  | { type: 'deleteAccount' }
  | null;

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

  const hasPassword =
    hasPasswordOverride ||
    identities.some(identity => identity.provider === 'email') ||
    (Array.isArray(user?.app_metadata.providers) && user.app_metadata.providers.includes('email'));

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

  useEffect(() => {
    if (securityQuery.error) toast.error(securityQuery.error.message);
  }, [securityQuery.error]);

  useEffect(() => {
    if (deleteState?.error) toast.error(deleteState.error);
    if (deleteState?.success) void supabase.auth.signOut().then(() => window.location.assign('/'));
  }, [deleteState, supabase]);

  const changeProvider = async (provider: 'google' | 'apple') => {
    const identity = identities.find(item => item.provider === provider);

    if (identity && identities.length < 2 && passkeys.length === 0) {
      toast.error('Add another sign-in method before disconnecting your last login method.');
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
    setPending('passkey');

    const { error } = await supabase.auth.registerPasskey();

    setPending(null);

    if (error) toast.error(error.message);
    else {
      toast.success('Passkey added.');
      await refreshSecurity();
    }
  };

  const removePasskey = async (passkeyId: string) => {
    if (passkeys.length === 1 && identities.length < 2) {
      toast.error('Add another sign-in method before removing your last passkey.');
      return;
    }

    setPending(passkeyId);

    const { error } = await supabase.auth.passkey.delete({ passkeyId });

    setPending(null);

    if (error) toast.error(error.message);
    else {
      toast.success('Passkey removed.');
      await refreshSecurity();
    }
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
    toast.success('Authenticator setup cancelled.');
    await refreshSecurity();
  };

  const disableMfa = async (factorId: string) => {
    setPending(factorId);

    const { error } = await supabase.auth.mfa.unenroll({ factorId });

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
            onClick={() => setDialog({ type: 'verify', setting: 'email' })}
          />
          <SettingsOptionRow
            title='Phone Number'
            value={user?.phone || 'Not set'}
            onClick={() => setDialog({ type: 'verify', setting: 'phone' })}
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
            onClick={() => setDialog({ type: 'verify', setting: 'location' })}
          />
          <SettingsOptionRow
            title='Gender'
            value={typeof user?.user_metadata.gender === 'string' ? user.user_metadata.gender || 'Not set' : 'Not set'}
            onClick={() => setDialog({ type: 'verify', setting: 'gender' })}
          />
        </div>
      </Section>

      <Section title='Account Authorization'>
        {(['google', 'apple'] as const).map(provider => {
          const label = provider === 'google' ? 'Google' : 'Apple';
          const connected = hasProvider(provider);

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
              onClick={() => setDialog({ type: 'verify', setting: 'passkey' })}
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
                onClick={() => setDialog({ type: 'verify', setting: 'mfa' })}
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
              onClick={() => setDialog({ type: 'verify', setting: 'backupCodes' })}
            >
              {backupCodes ? 'Regenerate' : 'Generate'}
            </Button>
          </div>

          <p className='text-xs text-muted-foreground'>Generate one-time codes to store somewhere safe.</p>

          {backupCodes ? (
            <div className='rounded bg-muted p-3 font-mono text-xs leading-6'>
              {backupCodes.map(code => (
                <div key={code}>{code}</div>
              ))}
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
            <Trash2 className='size-3.5' /> Delete account
          </Button>
        </div>
      </Section>

      <VerifyPasswordDialog
        setting={dialog?.type === 'verify' ? dialog.setting : null}
        onCloseAction={() => setDialog(null)}
        onVerifiedAction={async result => {
          toast.success(result.success);

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

      <SensitiveSettingDialog
        dialog={dialog?.type === 'edit' ? dialog : null}
        user={user ?? null}
        onCloseAction={() => setDialog(null)}
      />

      <ChangePasswordDialog open={dialog?.type === 'changePassword'} onCloseAction={() => setDialog(null)} />

      <SetPasswordDialog
        open={dialog?.type === 'setPassword'}
        onCloseAction={() => setDialog(null)}
        onSuccessAction={() => setHasPasswordOverride(true)}
      />

      <MfaDialog
        open={dialog?.type === 'mfa'}
        enrollment={enrollment}
        code={mfaCode}
        pending={pending}
        onCodeChangeAction={setMfaCode}
        onVerifiedAction={() => void verifyMfa()}
        onCancelAction={() => void cancelMfaEnrollment()}
      />

      <BackupCodesDialog
        open={dialog?.type === 'backupCodes'}
        hasCodes={Boolean(backupCodes)}
        onCloseAction={() => setDialog(null)}
        onGeneratedAction={codes => {
          setBackupCodes(codes);
          setDialog(null);
        }}
      />

      <DeleteAccountDialog
        open={dialog?.type === 'deleteAccount'}
        onCloseAction={() => setDialog(null)}
        action={deleteAccount}
        pending={deletingAccount}
      />
    </div>
  );
};
