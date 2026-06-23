import { SettingsForm } from '@/components/settings/settings-form';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { SearchParamsProps } from '@/lib/types';

const SettingsPage = async ({ searchParams }: SearchParamsProps<{ tab?: string | string[] }>) => {
  const profile = await getSessionUser();
  if (!profile) redirect('/auth/sign-in');
  const { tab } = await searchParams;
  const initialTab = tab === 'profile' ? 'profile' : 'account';

  return <main className='mx-auto w-full max-w-3xl px-4 py-6 sm:px-6'><h1 className='mb-1 text-2xl font-bold'>Settings</h1><p className='mb-6 text-sm text-muted-foreground'>Manage your account and public profile.</p><SettingsForm profile={profile} initialTab={initialTab} /></main>;
};

export default SettingsPage;
