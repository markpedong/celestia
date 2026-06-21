import { CreateCommunityForm } from '@/components/community/create-community-form';
import { getSessionUser } from '@/lib/auth';
import { ArrowLeft, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const NewCommunityPage = async () => {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');

  return (
    <div className='mx-auto max-w-2xl'>
      <Link href='/' className='mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
        <ArrowLeft className='size-4' /> Back to feed
      </Link>
      <div className='mb-5'>
        <p className='celestia-panel-label mb-2'><UsersRound className='size-3' /> New community</p>
        <h1 className='text-2xl font-bold tracking-tight'>Create a community</h1>
        <p className='mt-2 text-sm leading-6 text-muted-foreground'>You will join automatically and can start the first discussion right away.</p>
      </div>
      <CreateCommunityForm />
    </div>
  );
};

export default NewCommunityPage;
