'use client';

import Link from 'next/link';
import CommentComposer from '@/components/post/comment-composer';
import { useGetProfile } from '@/hooks/useQueries';

export const ClientCommentComposerGate = ({ postID }: { postID: string }) => {
  const { data } = useGetProfile();

  if (data?.data)
    return (
      <div className='mb-8'>
        <CommentComposer postID={postID} user={data.data} />
      </div>
    );

  return (
    <p className='mb-8 rounded border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground'>
      <Link href='/auth/sign-in' className='font-medium text-primary hover:underline'>
        Sign in
      </Link>{' '}
      to join the discussion.
    </p>
  );
};
