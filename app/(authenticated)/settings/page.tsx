import { AccountSettings } from '@/components/auth/account-settings';
import { SettingsTabs } from '@/components/auth/settings-tabs';
import { ProfileSettingsForm } from '@/components/profile/profile-settings-form';
import { getSessionUser } from '@/lib/auth';
import { getProfileSettingsByUserID } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

const SettingsPage = async () => {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');
  const profile = await getProfileSettingsByUserID(user.id);
  if (!profile) redirect('/');

  return (
    <div className='mx-auto max-w-3xl pb-8'>
      <header className='mb-5'>
        <h1 className='text-2xl font-bold tracking-tight'>Settings</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Manage your account, preferences, and public profile.</p>
      </header>
      <SettingsTabs account={<AccountSettings />} profile={<ProfileSettingsForm profile={profile} />} />
    </div>
  );
};

export default SettingsPage;
