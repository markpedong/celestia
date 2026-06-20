import { SubmitPostForm } from '@/components/post/submit-post-form';
import { getSessionUser } from '@/lib/auth';
import { listJoinedCommunities } from '@/lib/db/queries';
import type { SubmitPageProps } from '@/lib/types';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/auth/sign-in');
  }

  const query = await searchParams;
  const selectedCommunity = Array.isArray(query.community) ? query.community[0] : query.community;
  const communities = await listJoinedCommunities(user.id);

  return (
    <div>
      <Link
        href='/'
        className='mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Back
      </Link>
      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]'>
        <div className='min-w-0'>
          <div className='mb-4 flex flex-wrap items-end justify-between gap-3'>
            <div>
              <p className='celestia-panel-label mb-2'>
                <Send className='size-3' />
                New discussion
              </p>
              <h1 className='text-xl font-bold tracking-tight'>Create Post</h1>
              <p className='mt-1 text-sm text-muted-foreground'>
                Signed in as {user.displayName ?? user.username}. Choose one of your communities, then add a title and body.
              </p>
            </div>
            <div className='flex items-center gap-4 text-sm font-medium'>
              <Link href='/communities/new' className='text-primary hover:text-primary-hover'>Create community</Link>
              <Link href='/' className='text-muted-foreground hover:text-foreground'>Discard</Link>
            </div>
          </div>
          <SubmitPostForm communities={communities} defaultCommunitySlug={selectedCommunity} />
        </div>
        <aside className='hidden xl:block'>
          <div className='sticky top-20 space-y-4'>
            <section className='celestia-card overflow-hidden'>
              <div className='celestia-orbit-thumb h-24 border-b border-border/70' />
              <div className='p-3'>
                <p className='mb-2 inline-flex rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary'>
                  Preview
                </p>
                <h2 className='text-sm font-semibold leading-snug'>Your post will appear in this compact feed format.</h2>
                <p className='mt-2 text-xs leading-5 text-muted-foreground'>
                  Keep the title specific, add enough context, and choose the community where the discussion belongs.
                </p>
                <div className='mt-3 flex items-center gap-3 text-xs text-muted-foreground'>
                  <span className='font-mono text-primary'>128</span>
                  <span className='inline-flex items-center gap-1'><MessageSquare className='size-3' /> 34</span>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
