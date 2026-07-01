'use client';

import Link from 'next/link';
import CommentComposer from '@/components/post/comment-composer';
import { Button } from '@/components/ui/button';
import { useCommunityJoin, useGetCommunityMember, useGetProfile } from '@/hooks/useQueries';
import { Plus } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

export const ClientCommentComposerGate = ({ postID, communitySlug }: { postID: string; communitySlug?: string }) => {
  const { session } = useSession();
  const { data } = useGetProfile();
  const memberQuery = useGetCommunityMember(communitySlug ?? '');
  const { mutate, isPending } = useCommunityJoin();
  const user = data?.data;
  const isMember = memberQuery.data?.data?.isMember;

  if (session === undefined || (user && communitySlug && isMember === undefined)) return null;

  if (user && isMember)
    return (
      <div className='mb-8'>
        <CommentComposer postID={postID} user={user} />
      </div>
    );

  if (user && communitySlug) {
    return (
      <div className='mb-8 flex flex-wrap items-center justify-between gap-3 rounded border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground'>
        <span>
          Join{' '}
          <Link href={`/r/${communitySlug}`} className='font-medium text-primary hover:underline'>
            r/{communitySlug}
          </Link>{' '}
          to comment.
        </span>
        <Button
          type='button'
          size='sm'
          isLoading={isPending || memberQuery.isFetching}
          loadingText='Joining...'
          className='celestia-primary-action rounded'
          onClick={() => mutate(communitySlug)}
        >
          <Plus />
          Join community
        </Button>
      </div>
    );
  }

  return (
    <p className='mb-8 rounded border border-dashed border-primary/25 bg-primary/5 p-4 text-sm text-muted-foreground'>
      <Link href='/auth/sign-in' className='font-medium text-primary hover:underline'>
        Sign in
      </Link>{' '}
      to join the discussion.
    </p>
  );
};
