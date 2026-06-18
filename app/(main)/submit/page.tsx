import { SubmitPostForm } from '@/components/post/submit-post-form';
import { getSessionUser } from '@/lib/auth';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function SubmitPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <div className='max-w-2xl'>
      <Link
        href='/'
        className='mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Back
      </Link>
      <div className='mb-6 flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>New Signal</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Signed in as {user.displayName ?? user.username}. Posts use topics instead of communities.
          </p>
        </div>
        <Link href='/' className='text-sm font-medium text-muted-foreground hover:text-foreground'>
          Discard
        </Link>
      </div>
      <SubmitPostForm />
    </div>
  );
}
