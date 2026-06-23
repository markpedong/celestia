import { AccountSettings } from '@/components/auth/account-settings';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

const SettingsPage = async () => {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');
  return <div className='mx-auto max-w-3xl pb-8'><header className='mb-5'><h1 className='text-2xl font-bold tracking-tight'>Account Settings</h1><p className='mt-1 text-sm text-muted-foreground'>Manage your sign-in, security, and app settings.</p></header><AccountSettings /></div>;
};

export default SettingsPage;
