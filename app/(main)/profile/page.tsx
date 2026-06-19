import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  redirect(`/u/${user.username}`);
}
