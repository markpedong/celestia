'use client';

import { useActionState, useEffect, useState, useTransition, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { KeyRound, Link2, Moon, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { SettingsDialog } from '@/components/ui/settings-dialog';
import { SettingsOptionRow } from '@/components/ui/settings-option-row';
import { changePasswordAction, deleteAccountAction, generateBackupCodesAction, updateSensitiveAccountAction, verifyAccountPasswordAction } from '@/lib/actions/security';

type SensitiveSetting = 'email' | 'phone' | 'gender' | 'location' | 'passkey';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className='celestia-card space-y-5 p-5 md:p-6'>
    <h2 className='text-base font-semibold'>{title}</h2>
    {children}
  </section>
);

export const AccountSettings = () => {
  const { supabase, user } = useSession();
  const { theme, setTheme } = useTheme();
  const [pending, setPending] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<'email' | 'phone' | 'password' | 'gender' | 'location' | null>(null);
  const [passwordGate, setPasswordGate] = useState<SensitiveSetting | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isVerifying, startVerifying] = useTransition();
  const [isSavingSensitive, startSavingSensitive] = useTransition();
  const [isChangingPassword, startChangingPassword] = useTransition();
  const [backupState, generateBackupCodes, generatingCodes] = useActionState(generateBackupCodesAction, null);
  const [deleteState, deleteAccount, deletingAccount] = useActionState(deleteAccountAction, null);
  const identities = user?.identities ?? [];
  const hasProvider = (provider: 'google' | 'apple') => identities.some(identity => identity.provider === provider);
  const queryClient = useQueryClient();
  const securityQuery = useQuery({
    queryKey: ['auth', 'security', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [passkeyResult, factorResult] = await Promise.all([supabase.auth.passkey.list(), supabase.auth.mfa.listFactors()]);
      if (passkeyResult.error) throw passkeyResult.error;
      if (factorResult.error) throw factorResult.error;
      return {
        passkeys: passkeyResult.data ?? [],
        factors: factorResult.data.totp,
        pendingTotpFactors: factorResult.data.all.filter(factor => factor.factor_type === 'totp' && factor.status === 'unverified'),
      };
    },
  });
  const passkeys = securityQuery.data?.passkeys ?? [];
  const factors = securityQuery.data?.factors ?? [];
  const pendingTotpFactors = securityQuery.data?.pendingTotpFactors ?? [];

  const refreshSecurity = () => queryClient.invalidateQueries({ queryKey: ['auth', 'security', user?.id] });
  useEffect(() => {
    if (backupState?.error) toast.error(backupState.error);
    if (backupState?.success) toast.success(backupState.success);
  }, [backupState]);
  useEffect(() => {
    if (securityQuery.error) toast.error(securityQuery.error.message);
  }, [securityQuery.error]);
  useEffect(() => {
    if (deleteState?.error) toast.error(deleteState.error);
    if (deleteState?.success) void supabase.auth.signOut().then(() => window.location.assign('/'));
  }, [deleteState, supabase]);

  const verifySensitiveSetting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startVerifying(async () => {
      const result = await verifyAccountPasswordAction(formData);
      if (result?.error || !result?.setting || !result.token) {
        toast.error(result?.error ?? 'Unable to verify your password.');
        return;
      }
      if (result.setting === 'passkey') {
        setPasswordGate(null);
        toast.success(result.success);
        await registerPasskey();
        return;
      }
      setVerificationToken(result.token);
      setPasswordGate(null);
      setActiveEditor(result.setting);
      toast.success(result.success);
    });
  };

  const saveSensitiveSetting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startSavingSensitive(async () => {
      const result = await updateSensitiveAccountAction(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setActiveEditor(null);
      setVerificationToken('');
      toast.success(result?.success ?? 'Account details updated.');
    });
  };

  const submitPasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startChangingPassword(async () => {
      const result = await changePasswordAction(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setActiveEditor(null);
      toast.success(result?.success ?? 'Password updated.');
    });
  };

  const changeProvider = async (provider: 'google' | 'apple') => {
    const identity = identities.find(item => item.provider === provider);
    if (identity && identities.length < 2 && passkeys.length === 0) {
      toast.error('Add another sign-in method before disconnecting your last login method.');
      return;
    }
    setPending(provider);
    const result = identity
      ? await supabase.auth.unlinkIdentity(identity)
      : await supabase.auth.linkIdentity({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/settings` } });
    setPending(null);
    if (result.error) toast.error(result.error.message);
    else if (identity) toast.success(`${provider === 'google' ? 'Google' : 'Apple'} disconnected.`);
  };

  async function registerPasskey() {
    setPending('passkey');
    const { error } = await supabase.auth.registerPasskey();
    setPending(null);
    if (error) toast.error(error.message); else { toast.success('Passkey added.'); await refreshSecurity(); }
  }

  const removePasskey = async (passkeyId: string) => {
    if (passkeys.length === 1 && identities.length < 2) return toast.error('Add another sign-in method before removing your last passkey.');
    setPending(passkeyId);
    const { error } = await supabase.auth.passkey.delete({ passkeyId });
    setPending(null);
    if (error) toast.error(error.message); else { toast.success('Passkey removed.'); await refreshSecurity(); }
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
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' });
    setPending(null);
    if (error || !data?.totp) return toast.error(error?.message ?? 'Unable to start MFA enrollment.');
    setEnrollment({ id: data.id, qr: data.totp.qr_code });
  };

  const verifyMfa = async () => {
    if (!enrollment || !mfaCode) return;
    setPending('mfa-verify');
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.id });
    const result = challenge.error ? challenge : await supabase.auth.mfa.verify({ factorId: enrollment.id, challengeId: challenge.data.id, code: mfaCode });
    setPending(null);
    if (result.error) return toast.error(result.error.message);
    toast.success('Two-factor authentication enabled.'); setEnrollment(null); setMfaCode(''); await refreshSecurity();
  };

  const cancelMfaEnrollment = async () => {
    if (!enrollment) return;
    setPending('mfa-cancel');
    const { error } = await supabase.auth.mfa.unenroll({ factorId: enrollment.id });
    setPending(null);
    if (error) return toast.error(error.message);
    setEnrollment(null);
    setMfaCode('');
    toast.success('Authenticator setup cancelled.');
    await refreshSecurity();
  };

  const disableMfa = async (factorId: string) => {
    setPending(factorId);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setPending(null);
    if (error) toast.error(error.message); else { toast.success('Two-factor authentication disabled.'); await refreshSecurity(); }
  };

  return (
    <div className='space-y-5'>
      <Section title='General'>
        <div className='divide-y divide-border rounded-lg border border-border'>
          <SettingsOptionRow title='Change email' value={user?.email} onClick={() => setPasswordGate('email')} />
          <SettingsOptionRow title='Phone Number' value={user?.phone || 'Not set'} onClick={() => setPasswordGate('phone')} />
          <SettingsOptionRow title='Change Password' description='Update your account password.' onClick={() => setActiveEditor('password')} />
          <SettingsOptionRow title='Location' value={typeof user?.user_metadata.location === 'string' ? user.user_metadata.location || 'Not set' : 'Not set'} onClick={() => setPasswordGate('location')} />
          <SettingsOptionRow title='Gender' value={typeof user?.user_metadata.gender === 'string' ? user.user_metadata.gender || 'Not set' : 'Not set'} onClick={() => setPasswordGate('gender')} />
        </div>
      </Section>

      <SettingsDialog open={passwordGate !== null} onOpenChange={open => !open && setPasswordGate(null)} title='Verify your password' description='Enter your password to continue editing this setting.'>
        <form onSubmit={verifySensitiveSetting} className='space-y-4'>
          <input type='hidden' name='setting' value={passwordGate ?? ''} />
          <FormField htmlFor='verification-password' label='Current password'><Input id='verification-password' name='password' type='password' required autoComplete='current-password' /></FormField>
          <DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={isVerifying}>Verify password</Button></DialogFooter>
        </form>
      </SettingsDialog>

      <SettingsDialog open={activeEditor === 'email'} onOpenChange={open => !open && setActiveEditor(null)} title='Change email' description='We’ll send a confirmation email to your new address.'>
          <form onSubmit={saveSensitiveSetting} className='space-y-4'>
            <input type='hidden' name='setting' value='email' /><input type='hidden' name='verificationToken' value={verificationToken} />
            <FormField htmlFor='email' label='Email address'><Input id='email' name='value' type='email' defaultValue={user?.email ?? ''} required autoComplete='email' /></FormField>
            <DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={isSavingSensitive}>Save email</Button></DialogFooter>
          </form>
      </SettingsDialog>
      <SettingsDialog open={activeEditor === 'phone'} onOpenChange={open => !open && setActiveEditor(null)} title='Phone Number' description='Keep your phone number current for account recovery.'>
          <form onSubmit={saveSensitiveSetting} className='space-y-4'>
            <input type='hidden' name='setting' value='phone' /><input type='hidden' name='verificationToken' value={verificationToken} />
            <FormField htmlFor='phone' label='Phone number'><Input id='phone' name='value' type='tel' defaultValue={user?.phone ?? ''} placeholder='+63 900 000 0000' autoComplete='tel' /></FormField>
            <DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={isSavingSensitive}>Save phone</Button></DialogFooter>
          </form>
      </SettingsDialog>
      <SettingsDialog open={activeEditor === 'password'} onOpenChange={open => !open && setActiveEditor(null)} title='Change Password' description='Use at least six characters for your new password.'>
          <form onSubmit={submitPasswordChange} className='space-y-4'>
            <FormField htmlFor='current-password' label='Current password'><Input id='current-password' name='currentPassword' type='password' required autoComplete='current-password' /></FormField>
            <FormField htmlFor='new-password' label='New password'><Input id='new-password' name='newPassword' type='password' minLength={6} required autoComplete='new-password' /></FormField>
            <FormField htmlFor='confirm-password' label='Confirm new password'><Input id='confirm-password' name='confirmPassword' type='password' minLength={6} required autoComplete='new-password' /></FormField>
            <DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={isChangingPassword}>Save password</Button></DialogFooter>
          </form>
      </SettingsDialog>
      {(['location', 'gender'] as const).map(field => (
        <SettingsDialog key={field} open={activeEditor === field} onOpenChange={open => !open && setActiveEditor(null)} title={field === 'location' ? 'Location' : 'Gender'} description='Update this account preference.'>
            <form onSubmit={saveSensitiveSetting} className='space-y-4'>
              <input type='hidden' name='setting' value={field} /><input type='hidden' name='verificationToken' value={verificationToken} />
              <FormField htmlFor={`profile-${field}`} label={field === 'location' ? 'Location' : 'Gender'}><Input id={`profile-${field}`} name='value' defaultValue={typeof user?.user_metadata[field] === 'string' ? user.user_metadata[field] : ''} /></FormField>
              <DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' isLoading={isSavingSensitive}>Save {field}</Button></DialogFooter>
            </form>
        </SettingsDialog>
      ))}

      <Section title='Account Authorization'>
        {(['google', 'apple'] as const).map(provider => {
          const label = provider === 'google' ? 'Google' : 'Apple';
          const connected = hasProvider(provider);
          return <div key={provider} className='flex items-center justify-between gap-3 rounded-md border border-border p-3'>
            <span className='flex items-center gap-2 text-sm'><Link2 className='size-4 text-muted-foreground' /> {label} {connected ? 'connected' : 'not connected'}</span>
            <Button size='sm' variant='outline' onClick={() => void changeProvider(provider)} isLoading={pending === provider}>{connected ? 'Disconnect' : 'Connect'}</Button>
          </div>;
        })}
        <div className='space-y-2 rounded-md border border-border p-3'>
          <div className='flex items-center justify-between gap-3'><span className='flex items-center gap-2 text-sm'><KeyRound className='size-4 text-muted-foreground' /> Passkeys</span><Button size='sm' variant='outline' onClick={() => setPasswordGate('passkey')} isLoading={pending === 'passkey'}>Add passkey</Button></div>
          {passkeys.map(passkey => <div key={passkey.id} className='flex items-center justify-between gap-3 text-xs text-muted-foreground'><span>{passkey.friendly_name ?? 'Passkey'} · added {new Date(passkey.created_at).toLocaleDateString()}</span><Button size='xs' variant='ghost' onClick={() => void removePasskey(passkey.id)} isLoading={pending === passkey.id}>Remove</Button></div>)}
        </div>
        <div className='space-y-3 rounded-md border border-border p-3'>
          <div className='flex items-center justify-between gap-3'><span className='flex items-center gap-2 text-sm'><ShieldCheck className='size-4 text-muted-foreground' /> Two-Factor Authentication</span>{factors.length ? null : <Button size='sm' variant='outline' onClick={() => void enrollMfa()} isLoading={pending === 'mfa-enroll'}>Set up</Button>}</div>
          {enrollment ? <div className='space-y-3 rounded bg-muted/50 p-3'><Image src={`data:image/svg+xml;utf8,${encodeURIComponent(enrollment.qr)}`} alt='Authenticator setup QR code' width={176} height={176} unoptimized className='size-44 bg-background p-2' /><Input value={mfaCode} onChange={event => setMfaCode(event.target.value)} inputMode='numeric' placeholder='6-digit code' className='h-11 bg-background' /><div className='flex gap-2'><Button size='sm' onClick={() => void verifyMfa()} isLoading={pending === 'mfa-verify'}>Verify and enable</Button><Button size='sm' variant='outline' onClick={() => void cancelMfaEnrollment()} isLoading={pending === 'mfa-cancel'}>Cancel</Button></div></div> : null}
          {factors.map(factor => <div key={factor.id} className='flex items-center justify-between gap-3 text-xs text-muted-foreground'><span>{factor.friendly_name ?? 'Authenticator app'} enabled</span><Button size='xs' variant='ghost' onClick={() => void disableMfa(factor.id)} isLoading={pending === factor.id}>Disable</Button></div>)}
        </div>
        <div className='space-y-3 rounded-md border border-border p-3'><div className='flex items-center justify-between gap-3'><span className='flex items-center gap-2 text-sm'><Smartphone className='size-4 text-muted-foreground' /> Backup Codes</span><form action={generateBackupCodes}><Button type='submit' size='sm' variant='outline' isLoading={generatingCodes}>{backupState?.codes ? 'Regenerate' : 'Generate'}</Button></form></div>{backupState?.codes ? <div className='rounded bg-muted p-3 font-mono text-xs leading-6'>{backupState.codes.map(code => <div key={code}>{code}</div>)}</div> : <p className='text-xs text-muted-foreground'>Generate one-time codes to store somewhere safe.</p>}</div>
      </Section>

      <Section title='Apps'>
        <div className='flex items-center justify-between gap-3'>
          <span className='flex items-center gap-2 text-sm'><Moon className='size-4 text-muted-foreground' /> Dark Mode</span>
          <Button variant='outline' size='sm' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle</Button>
        </div>
      </Section>

      <Section title='Advanced'>
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/35 bg-destructive/5 p-3'>
          <div><p className='text-sm font-medium'>Delete Account</p><p className='text-xs text-muted-foreground'>This permanently removes your account and data.</p></div>
          <Button variant='destructive' size='sm' onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className='size-3.5' /> Delete account</Button>
        </div>
      </Section>
      <SettingsDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} title='Delete account?' description='This permanently deletes your account, profile, posts, comments, votes, memberships, and backup codes.'>
          <form action={deleteAccount} className='space-y-4'>
            <FormField htmlFor='delete-confirmation' label='Type DELETE to confirm'><Input id='delete-confirmation' name='confirmation' autoComplete='off' required /></FormField>
            <DialogFooter><DialogClose asChild><Button type='button' variant='outline'>Cancel</Button></DialogClose><Button type='submit' variant='destructive' isLoading={deletingAccount}>Delete account</Button></DialogFooter>
          </form>
      </SettingsDialog>
    </div>
  );
};
