'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommunityJoin, useGetCommunityMember, useGetProfile } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';

export const ClientCommunityJoinButton = ({ communitySlug }: { communitySlug: string }) => {
  const { session } = useSession();
  const user = useGetProfile().data?.data;
  const memberQuery = useGetCommunityMember(communitySlug);
  const { mutate, isPending } = useCommunityJoin();
  const isSignedIn = session === undefined ? Boolean(user) : Boolean(session);
  const isMember = memberQuery.data?.data?.isMember;

  if (isMember) return null;

  if (!isSignedIn) {
    return (
      <Button asChild size='xs' className='celestia-primary-action rounded'>
        <Link href='/auth/sign-in'>
          <Plus /> Join
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type='button'
      size='xs'
      className='celestia-primary-action rounded'
      isLoading={isPending || memberQuery.isFetching}
      loadingText='Joining...'
      onClick={() => mutate(communitySlug)}
    >
      <Plus /> Join
    </Button>
  );
};
