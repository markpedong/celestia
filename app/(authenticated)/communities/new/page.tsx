import { CreateCommunityForm } from '@/components/community/create-community-form';
import { RightTrending } from '@/components/layout/right-trending';
import { getSessionUser } from '@/lib/auth';
import { getPublicShellData } from '@/lib/public-data';
import { ArrowLeft, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const NewCommunityPage = async () => {
  const [user, shellData] = await Promise.all([getSessionUser(), getPublicShellData()]);
  if (!user) redirect('/auth/sign-in');

  return (
    <div className='mx-auto w-full max-w-5xl px-4 py-6 md:py-10'>
      <Link href='/' className='mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'>
        <ArrowLeft className='size-4' /> Back to feed
      </Link>
      <div className='relative'>
        <div className='mb-6 max-w-2xl'>
          <p className='celestia-panel-label mb-2'><UsersRound className='size-3' /> New community</p>
          <h1 className='text-3xl font-black tracking-tight md:text-4xl'>Create a community</h1>
          <p className='mt-3 text-sm leading-6 text-muted-foreground'>Set the name, URL, visuals, and color people will recognize across feeds and posts.</p>
        </div>
        <CreateCommunityForm />
        <aside className='absolute top-0 left-[calc(100%+1.5rem)] hidden w-72 2xl:block'>
          <div className='sticky top-20'>
            <RightTrending items={shellData.trending} communities={shellData.communities} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NewCommunityPage;
