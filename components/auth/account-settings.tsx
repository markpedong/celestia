'use client';

import { useActionState, useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { KeyRound, Link2, Moon, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useSession } from '@/hooks/useSession';
import { useUpdateAuthUser } from '@/hooks/useQueries';
import type { UserAttributes } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { deleteAccountAction, generateBackupCodesAction } from '@/lib/actions/security';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className='celestia-card space-y-5 p-5 md:p-6'>
    <h2 className='text-base font-semibold'>{title}</h2>
    {children}
  </section>
);

export const AccountSettings = () => {
  const { supabase, user } = useSession();
  const updateAuthUser = useUpdateAuthUser();
  const { theme, setTheme } = useTheme();
  const [pending, setPending] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<{ id: string; qr: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
      return { passkeys: passkeyResult.data ?? [], factors: factorResult.data.totp };
    },
  });
  const passkeys = securityQuery.data?.passkeys ?? [];
  const factors = securityQuery.data?.factors ?? [];

  const refreshSecurity = () => queryClient.invalidateQueries({ queryKey: ['auth', 'security', user?.id] });
  useEffect(() => {
    if (backupState?.error) toast.error(backupState.error);
    if (backupState?.success) toast.success(backupState.success);
  }, [backupState]);
  useEffect(() => {
    if (deleteState?.error) toast.error(deleteState.error);
    if (deleteState?.success) void supabase.auth.signOut().then(() => window.location.assign('/'));
  }, [deleteState, supabase]);

  const submitUpdate = async (event: FormEvent<HTMLFormElement>, field: 'email' | 'phone' | 'password') => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get(field);
    if (typeof value !== 'string' || !value) return;
    setPending(field);
    try {
      await updateAuthUser.mutateAsync({ [field]: value } as UserAttributes);
    } catch (error) {
      setPending(null);
      toast.error(error instanceof Error ? error.message : 'Unable to update your account.');
      return;
    }
    setPending(null);
    toast.success(field === 'email' ? 'Check your inbox to confirm your new email.' : 'Account details updated.');
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

  const registerPasskey = async () => {
    setPending('passkey');
    const { error } = await supabase.auth.registerPasskey();
    setPending(null);
    if (error) toast.error(error.message); else { toast.success('Passkey added.'); await refreshSecurity(); }
  };

  const removePasskey = async (passkeyId: string) => {
    if (passkeys.length === 1 && identities.length < 2) return toast.error('Add another sign-in method before removing your last passkey.');
    setPending(passkeyId);
    const { error } = await supabase.auth.passkey.delete({ passkeyId });
    setPending(null);
    if (error) toast.error(error.message); else { toast.success('Passkey removed.'); await refreshSecurity(); }
  };

  const enrollMfa = async () => {
    setPending('mfa-enroll');
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

  const disableMfa = async (factorId: string) => {
    setPending(factorId);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setPending(null);
    if (error) toast.error(error.message); else { toast.success('Two-factor authentication disabled.'); await refreshSecurity(); }
  };

  const savePreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData) as Record<string, string>;
    setPending('preferences');
    try {
      await updateAuthUser.mutateAsync({ data });
    } catch (error) {
      setPending(null);
      toast.error(error instanceof Error ? error.message : 'Unable to update your preferences.');
      return;
    }
    setPending(null);
    toast.success('Account preferences updated.');
  };

  return (
    <div className='space-y-5'>
      <Section title='General'>
        <form onSubmit={event => void submitUpdate(event, 'email')} className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <FormField htmlFor='email' label='Change email' className='flex-1'>
            <Input id='email' name='email' type='email' defaultValue={user?.email ?? ''} required />
          </FormField>
          <Button type='submit' variant='outline' isLoading={pending === 'email'}>Update email</Button>
        </form>
        <form onSubmit={event => void submitUpdate(event, 'phone')} className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <FormField htmlFor='phone' label='Phone number' className='flex-1'>
            <Input id='phone' name='phone' type='tel' defaultValue={user?.phone ?? ''} placeholder='+63 900 000 0000' />
          </FormField>
          <Button type='submit' variant='outline' isLoading={pending === 'phone'}>Update phone</Button>
        </form>
        <form onSubmit={event => void submitUpdate(event, 'password')} className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <FormField htmlFor='password' label='Change password' className='flex-1'>
            <Input id='password' name='password' type='password' minLength={6} required autoComplete='new-password' />
          </FormField>
          <Button type='submit' variant='outline' isLoading={pending === 'password'}>Update password</Button>
        </form>
        <div className='space-y-2 rounded-md border border-border p-3'>
          <div className='flex items-center justify-between gap-3'><span className='flex items-center gap-2 text-sm'><KeyRound className='size-4 text-muted-foreground' /> Passkeys</span><Button size='sm' variant='outline' onClick={() => void registerPasskey()} isLoading={pending === 'passkey'}>Add passkey</Button></div>
          {passkeys.map(passkey => <div key={passkey.id} className='flex items-center justify-between gap-3 text-xs text-muted-foreground'><span>{passkey.friendly_name ?? 'Passkey'} · added {new Date(passkey.created_at).toLocaleDateString()}</span><Button size='xs' variant='ghost' onClick={() => void removePasskey(passkey.id)} isLoading={pending === passkey.id}>Remove</Button></div>)}
        </div>
        <form onSubmit={event => void savePreferences(event)} className='grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end'>
          <FormField htmlFor='gender' label='Gender'><Input id='gender' name='gender' defaultValue={typeof user?.user_metadata.gender === 'string' ? user.user_metadata.gender : ''} /></FormField>
          <FormField htmlFor='location' label='Location'><Input id='location' name='location' defaultValue={typeof user?.user_metadata.location === 'string' ? user.user_metadata.location : ''} /></FormField>
          <Button type='submit' variant='outline' isLoading={pending === 'preferences'}>Save</Button>
        </form>
      </Section>

      <Section title='Account Authorization'>
        {(['google', 'apple'] as const).map(provider => {
          const label = provider === 'google' ? 'Google' : 'Apple';
          const connected = hasProvider(provider);
          return <div key={provider} className='flex items-center justify-between gap-3 rounded-md border border-border p-3'>
            <span className='flex items-center gap-2 text-sm'><Link2 className='size-4 text-muted-foreground' /> {label} {connected ? 'connected' : 'not connected'}</span>
            <Button size='sm' variant='outline' onClick={() => void changeProvider(provider)} isLoading={pending === provider}>{connected ? 'Disconnect' : 'Connect'}</Button>
          </div>;
        })}
        <div className='space-y-3 rounded-md border border-border p-3'>
          <div className='flex items-center justify-between gap-3'><span className='flex items-center gap-2 text-sm'><ShieldCheck className='size-4 text-muted-foreground' /> Two-Factor Authentication</span>{factors.length ? null : <Button size='sm' variant='outline' onClick={() => void enrollMfa()} isLoading={pending === 'mfa-enroll'}>Set up</Button>}</div>
          {enrollment ? <div className='space-y-3 rounded bg-muted/50 p-3'><Image src={`data:image/svg+xml;utf8,${encodeURIComponent(enrollment.qr)}`} alt='Authenticator setup QR code' width={176} height={176} unoptimized className='size-44 bg-background p-2' /><Input value={mfaCode} onChange={event => setMfaCode(event.target.value)} inputMode='numeric' placeholder='6-digit code' /><Button size='sm' onClick={() => void verifyMfa()} isLoading={pending === 'mfa-verify'}>Verify and enable</Button></div> : null}
          {factors.map(factor => <div key={factor.id} className='flex items-center justify-between gap-3 text-xs text-muted-foreground'><span>{factor.friendly_name ?? 'Authenticator app'} enabled</span><Button size='xs' variant='ghost' onClick={() => void disableMfa(factor.id)} isLoading={pending === factor.id}>Disable</Button></div>)}
        </div>
        <div className='space-y-3 rounded-md border border-border p-3'><div className='flex items-center justify-between gap-3'><span className='flex items-center gap-2 text-sm'><Smartphone className='size-4 text-muted-foreground' /> Backup Codes</span><form action={generateBackupCodes}><Button type='submit' size='sm' variant='outline' isLoading={generatingCodes}>{backupState?.codes ? 'Regenerate' : 'Generate'}</Button></form></div>{backupState?.codes ? <div className='rounded bg-muted p-3 font-mono text-xs leading-6'>{backupState.codes.map(code => <div key={code}>{code}</div>)}</div> : <p className='text-xs text-muted-foreground'>Generate one-time codes to store somewhere safe.</p>}</div>
      </Section>

      <Section title='Apps'>
        <div className='flex items-center justify-between gap-3'>
          <span className='flex items-center gap-2 text-sm'><Moon className='size-4 text-muted-foreground' /> Dark Mode</span>
          <Button variant='outline' size='sm' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'On' : 'Off'}</Button>
        </div>
        <form onSubmit={event => void savePreferences(event)} className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <FormField htmlFor='defaultFeedSort' label='Application Preferences' className='flex-1'>
            <select id='defaultFeedSort' name='defaultFeedSort' defaultValue={typeof user?.user_metadata.defaultFeedSort === 'string' ? user.user_metadata.defaultFeedSort : 'hot'} className='flex h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'>
              <option value='hot'>Default feed: Hot</option>
              <option value='new'>Default feed: New</option>
              <option value='top'>Default feed: Top</option>
            </select>
          </FormField>
          <Button type='submit' variant='outline' isLoading={pending === 'preferences'}>Save preferences</Button>
        </form>
      </Section>

      <Section title='Advanced'>
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/35 bg-destructive/5 p-3'>
          <div><p className='text-sm font-medium'>Delete Account</p><p className='text-xs text-muted-foreground'>This permanently removes your account and data.</p></div>
          <Button variant='destructive' size='sm' onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className='size-3.5' /> Delete account</Button>
        </div>
      </Section>
      {isDeleteDialogOpen ? <div role='dialog' aria-modal='true' aria-labelledby='delete-account-title' className='fixed inset-0 z-100 grid place-items-center bg-foreground/30 p-4'><form action={deleteAccount} className='w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-5 shadow-xl'><div><h2 id='delete-account-title' className='text-lg font-semibold'>Delete account?</h2><p className='mt-1 text-sm text-muted-foreground'>This permanently deletes your account, profile, posts, comments, votes, memberships, and backup codes.</p></div><FormField htmlFor='delete-confirmation' label='Type DELETE to confirm'><Input id='delete-confirmation' name='confirmation' autoComplete='off' required /></FormField><div className='flex justify-end gap-2'><Button type='button' variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button><Button type='submit' variant='destructive' isLoading={deletingAccount}>Delete account</Button></div></form></div> : null}
    </div>
  );
};
