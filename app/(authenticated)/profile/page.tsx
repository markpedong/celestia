import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

const ProfilePage = async () => {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  redirect(`/u/${user.userName}`);
};

export default ProfilePage;
