import { SubmitPostForm } from '@/components/post/submit-post-form';
import { getSessionUser } from '@/lib/auth';
import { listJoinedCommunities } from '@/lib/db/queries';
import type { SubmitPageProps } from '@/lib/types';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const SubmitPage = async ({ searchParams }: SubmitPageProps) => {
  const [user, query] = await Promise.all([getSessionUser(), searchParams]);
  if (!user) {
    redirect('/auth/sign-in');
  }

  const selectedCommunity = Array.isArray(query.community) ? query.community[0] : query.community;
  const communities = await listJoinedCommunities(user.id);

  return (
    <div className='grid gap-5 max-w-5xl ml-7'>
      <div className='mb-4 flex flex-wrap flex-col items-start justify-between gap-3'>
        <p className='celestia-panel-label'>
          <Send className='size-3' />
          New discussion
        </p>
        <h1 className='text-xl font-bold tracking-tight flex gap-3'>
          <Link
            href='/'
            className='inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
          >
            <ArrowLeft className='size-4' />
          </Link>
          <span>Create Post</span>
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Signed in as {user.displayName ?? user.userName}. Choose one of your communities, then add a title and body.
        </p>
      </div>
      <SubmitPostForm communities={communities} defaultCommunitySlug={selectedCommunity} />
    </div>
  );
};

export default SubmitPage;
