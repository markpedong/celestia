import { ProfileSettingsForm } from '@/components/profile/profile-settings-form';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const ProfileSettingsPage = async () => {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { username: true, displayName: true, bio: true, avatarUrl: true, coverUrl: true },
  });
  if (!profile) redirect('/');

  return <div className='mx-auto max-w-3xl pb-8'><header className='mb-5'><h1 className='text-2xl font-bold tracking-tight'>Profile Settings</h1><p className='mt-1 text-sm text-muted-foreground'>Manage your public profile and how people find you.</p></header><ProfileSettingsForm profile={profile} /></div>;
};

export default ProfileSettingsPage;
