'use client';

import { useActionState, useEffect, useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { updateProfileSettingsAction } from '@/lib/actions/profile';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { ProfileMediaEditButton, ProfileMediaEditMode, ProfileMediaEditor } from '@/components/profile/profile-media-editor';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { User } from '@/lib/types';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className='celestia-card space-y-4 p-5'>
    <h2 className='text-base font-semibold'>{title}</h2>
    {children}
  </section>
);

const message = (error: { message: string } | null) => error ? toast.error(error.message) : toast.success('Saved.');

export const SettingsForm = ({ profile, initialTab = 'account' }: { profile: User; initialTab?: 'account' | 'profile' }) => {
  const { supabase, user } = useSession();
  const [profileState, saveProfile, profilePending] = useActionState(updateProfileSettingsAction, null);
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState<string>();
  const [mfa, setMfa] = useState<{ id: string; qr: string }>();
  const [mfaCode, setMfaCode] = useState('');
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (profileState?.error) toast.error(profileState.error);
    if (profileState?.success) toast.success(profileState.success);
  }, [profileState]);

  const run = async (name: string, job: () => Promise<{ error: { message: string } | null }>) => {
    setPending(name);
    try { message((await job()).error); } finally { setPending(undefined); }
  };
  const updateEmail = () => run('email', () => supabase.auth.updateUser({ email }, { emailRedirectTo: `${location.origin}/auth/callback?next=/settings` }));
  const updatePhone = () => run('phone', () => supabase.auth.updateUser({ phone }));
  const updatePassword = async () => {
    if (password.length < 8) return toast.error('Use at least 8 characters.');
    if (password !== confirmPassword) return toast.error('Passwords do not match.');
    await run('password', async () => {
      const result = await supabase.auth.updateUser({ password });
      if (!result.error) { setPassword(''); setConfirmPassword(''); }
      return result;
    });
  };
  const identities = user?.identities ?? [];
  const linked = (provider: string) => identities.find(identity => identity.provider === provider);
  const connect = (provider: 'google' | 'apple') => run(provider, () => supabase.auth.linkIdentity({ provider, options: { redirectTo: `${location.origin}/auth/callback?next=/settings` } }));
  const disconnect = (provider: 'google' | 'apple') => {
    const identity = linked(provider);
    if (!identity) return;
    if (identities.length < 2) return toast.error('Add another sign-in method before disconnecting this one.');
    void run(provider, () => supabase.auth.unlinkIdentity(identity));
  };
  const startMfa = async () => {
    setPending('mfa');
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Celestia' });
    setPending(undefined);
    if (error || !data) return toast.error(error?.message ?? 'Could not start two-factor setup.');
    setMfa({ id: data.id, qr: data.totp.qr_code });
  };
  const verifyMfa = async () => {
    if (!mfa) return;
    await run('mfa', async () => {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId: mfa.id, code: mfaCode });
      if (!result.error) { setMfa(undefined); setMfaCode(''); }
      return result;
    });
  };

  return (
    <div className='space-y-5'>
      <div className='flex gap-2 border-b border-border' role='tablist' aria-label='Settings sections'>
        <button type='button' role='tab' aria-selected={tab === 'account'} onClick={() => setTab('account')} className={tab === 'account' ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium' : 'px-3 py-2 text-sm text-muted-foreground'}>Account</button>
        <button type='button' role='tab' aria-selected={tab === 'profile'} onClick={() => setTab('profile')} className={tab === 'profile' ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium' : 'px-3 py-2 text-sm text-muted-foreground'}>Profile</button>
      </div>
      {tab === 'account' ? <div id='account' className='space-y-5'>
        <Section title='General'>
          <p className='text-sm text-muted-foreground'>Signed in as {user?.email ?? 'your account'}.</p>
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField label='Change email' htmlFor='email'><Input id='email' type='email' value={email} onChange={event => setEmail(event.target.value)} /></FormField>
            <div className='flex items-end'><Button type='button' isLoading={pending === 'email'} onClick={updateEmail}>Update email</Button></div>
            <FormField label='Phone number' htmlFor='phone' hint='Use international format, e.g. +15551234567.'><Input id='phone' type='tel' value={phone} onChange={event => setPhone(event.target.value)} /></FormField>
            <div className='flex items-end'><Button type='button' variant='outline' isLoading={pending === 'phone'} onClick={updatePhone}>Update phone</Button></div>
            <FormField label='New password' htmlFor='password'><Input id='password' type='password' value={password} onChange={event => setPassword(event.target.value)} /></FormField>
            <FormField label='Confirm new password' htmlFor='password-confirm'><Input id='password-confirm' type='password' value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} /></FormField>
          </div>
          <Button type='button' variant='outline' isLoading={pending === 'password'} onClick={updatePassword}>Change password</Button>
          <div className='rounded-lg border border-border p-3 text-sm text-muted-foreground'>
            <span className='font-medium text-foreground'>Passkeys</span><br />Coming soon.
            {/* ponytail: Supabase passkeys are experimental and this client is not configured to enable them. */}
          </div>
        </Section>
        <Section title='Account authorization'>
          {(['google', 'apple'] as const).map(provider => {
            const isLinked = Boolean(linked(provider));
            return <div key={provider} className='flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0'><div><p className='font-medium capitalize'>{provider}</p><p className='text-sm text-muted-foreground'>{isLinked ? 'Connected' : 'Not connected'}</p></div><Button type='button' variant='outline' isLoading={pending === provider} onClick={() => isLinked ? disconnect(provider) : connect(provider)}>{isLinked ? 'Disconnect' : 'Connect'}</Button></div>;
          })}
          <div className='space-y-3'><div><p className='font-medium'>Two-factor authentication</p><p className='text-sm text-muted-foreground'>Use an authenticator app for a second sign-in check.</p></div>
            {mfa ? <div className='space-y-3 rounded-lg border p-3'><Image src={mfa.qr} alt='Scan this code with your authenticator app' width={144} height={144} unoptimized className='size-36 bg-white p-2' /><div className='flex gap-2'><Input aria-label='Authenticator code' inputMode='numeric' value={mfaCode} onChange={event => setMfaCode(event.target.value)} placeholder='6-digit code' /><Button type='button' isLoading={pending === 'mfa'} onClick={verifyMfa}>Verify</Button></div></div> : <Button type='button' variant='outline' isLoading={pending === 'mfa'} onClick={startMfa}>Set up 2FA</Button>}
          </div>
          <div className='rounded-lg border border-border p-3 text-sm text-muted-foreground'><span className='font-medium text-foreground'>Backup codes</span><br />Coming soon. {/* TODO: add an encrypted, server-managed recovery-code flow if product requires it. */}</div>
        </Section>
        <Section title='Apps'><p className='text-sm text-muted-foreground'>Display mode is available in the account menu and is saved on this device.</p></Section>
        <Section title='Advanced'><p className='text-sm text-muted-foreground'>Account deletion needs a protected server-side Supabase Admin workflow, which this project intentionally does not configure in the browser.</p><Button type='button' variant='destructive' disabled>Delete account — Coming soon</Button></Section>
      </div> : null}
      {tab === 'profile' ? <Section title='Profile'>
        <form action={saveProfile} className='space-y-4'>
          <FormField label='Display name' htmlFor='displayName'><Input id='displayName' name='displayName' defaultValue={profile.displayName ?? profile.username} required /></FormField>
          <FormField label='About' htmlFor='bio' hint='Visible on your public profile. Up to 500 characters.'><Textarea id='bio' name='bio' defaultValue={profile.bio} maxLength={500} rows={4} /></FormField>
          <div className='grid gap-4 md:grid-cols-2'><FormField label='Gender' htmlFor='gender'><Input id='gender' name='gender' defaultValue={profile.gender} /></FormField><FormField label='Location' htmlFor='location'><Input id='location' name='location' defaultValue={profile.location} /></FormField></div>
          <Button isLoading={profilePending}>Save profile</Button>
        </form>
        <ProfileMediaEditMode><div className='flex items-center gap-4 rounded-lg border border-border p-4'><div className='group relative'><UserAvatar user={profile} size='lg' className='size-16' /><ProfileMediaEditor field='avatar' className='inset-0' /></div><div className='min-w-0 flex-1'><p className='font-medium'>Avatar and banner</p><p className='text-sm text-muted-foreground'>Choose edit, then select the image directly on your avatar or banner.</p></div><ProfileMediaEditButton /></div><div className='group relative mt-3 h-24 overflow-hidden rounded-lg bg-muted'>{profile.coverUrl ? <Image src={profile.coverUrl} alt='' fill unoptimized sizes='(max-width: 768px) 100vw, 768px' className='object-cover' /> : null}<ProfileMediaEditor field='cover' className='right-3 bottom-3' /></div></ProfileMediaEditMode>
      </Section> : null}
    </div>
  );
};
