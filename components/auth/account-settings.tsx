'use client';

import { useState, type FormEvent } from 'react';
import { KeyRound, Link2, Moon, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useSession } from '@/hooks/useSession';
import { useUpdateAuthUser } from '@/hooks/useQueries';
import type { UserAttributes } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';

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
  const identities = user?.identities ?? [];
  const hasProvider = (provider: 'google' | 'apple') => identities.some(identity => identity.provider === provider);

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
    setPending(provider);
    const result = identity
      ? await supabase.auth.unlinkIdentity(identity)
      : await supabase.auth.linkIdentity({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/settings` } });
    setPending(null);
    if (result.error) toast.error(result.error.message);
    else if (identity) toast.success(`${provider === 'google' ? 'Google' : 'Apple'} disconnected.`);
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
        <div className='flex items-center justify-between gap-3 rounded-md border border-border p-3'>
          <span className='flex items-center gap-2 text-sm'><KeyRound className='size-4 text-muted-foreground' /> Passkeys</span>
          <span className='text-xs text-muted-foreground'>Not available yet</span>
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
        <div className='flex items-center justify-between gap-3 rounded-md border border-border p-3'>
          <span className='flex items-center gap-2 text-sm'><ShieldCheck className='size-4 text-muted-foreground' /> Two-Factor Authentication</span>
          <span className='text-xs text-muted-foreground'>Not configured</span>
        </div>
        <div className='flex items-center justify-between gap-3 rounded-md border border-border p-3'>
          <span className='flex items-center gap-2 text-sm'><Smartphone className='size-4 text-muted-foreground' /> Backup Codes</span>
          <span className='text-xs text-muted-foreground'>Available after enabling 2FA</span>
        </div>
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
          <Button variant='destructive' size='sm' disabled title='Account deletion is not available yet'><Trash2 className='size-3.5' /> Delete account</Button>
        </div>
      </Section>
    </div>
  );
};
