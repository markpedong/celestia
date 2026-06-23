import { AccountSettings } from '@/components/auth/account-settings';
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form';
import { getSessionUser } from '@/lib/auth';
import { getProfileSettingsByUserId } from '@/lib/db/queries';
import Link from 'next/link';
import { redirect } from 'next/navigation';

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

const SettingsPage = async ({ searchParams }: SettingsPageProps) => {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');
  const query = await searchParams;
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const activeTab = requestedTab === 'profile' ? 'profile' : 'account';
  const profile = activeTab === 'profile'
    ? await getProfileSettingsByUserId(user.id)
    : null;
  if (activeTab === 'profile' && !profile) redirect('/');

  return (
    <div className='mx-auto max-w-3xl pb-8'>
      <header className='mb-5'>
        <h1 className='text-2xl font-bold tracking-tight'>Settings</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Manage your account, preferences, and public profile.</p>
      </header>
      <nav className='mb-5 flex border-b border-border/80 text-sm font-semibold' aria-label='Settings sections'>
        <Link href='/settings?tab=account' aria-current={activeTab === 'account' ? 'page' : undefined} className={`border-b-2 px-4 py-2.5 transition-colors ${activeTab === 'account' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Account</Link>
        <Link href='/settings?tab=profile' aria-current={activeTab === 'profile' ? 'page' : undefined} className={`border-b-2 px-4 py-2.5 transition-colors ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Profile</Link>
      </nav>
      {activeTab === 'account' ? <AccountSettings /> : <ProfileSettingsForm profile={profile!} />}
    </div>
  );
};

export default SettingsPage;
