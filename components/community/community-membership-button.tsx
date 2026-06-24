'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Plus, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useCommunityJoin, useGetCommunityMember, useGetProfile } from '@/hooks/useQueries';

type CommunityMembershipButtonProps = {
  ownerID: string;
};

const CommunityMembershipButton: FC<CommunityMembershipButtonProps> = ({ ownerID }) => {
  const slug = usePathname().split('/').pop() ?? '';
  const user = useGetProfile().data?.data;
  const session = useSession().session;
  const [isTransitionPending, startTransition] = useTransition();
  const initialIsMember = useGetCommunityMember(slug).data?.data?.isMember;

  const [optimisticMember, setOptimisticMember] = useOptimistic(initialIsMember);

  const { mutate, isPending } = useCommunityJoin();

  const resolvedIsOwner = Boolean(ownerID) && user?.id === ownerID;
  const resolvedIsSignedIn = session === undefined ? !!user : Boolean(session);
  const isSaving = isPending || isTransitionPending;

  if (!resolvedIsSignedIn) {
    return (
      <Button asChild size='sm' className='celestia-primary-action'>
        <Link href='/auth/sign-in'>Join community</Link>
      </Button>
    );
  }

  const toggleMembership = () => {
    startTransition(() => {
      setOptimisticMember(!optimisticMember);

      mutate(slug, {
        onError: () => {
          setOptimisticMember(optimisticMember);
        },
      });
    });
  };

  const renderCreatePost = () => (
    <Button asChild size='sm' className='celestia-primary-action'>
      <Link href={`/submit?community=${encodeURIComponent(slug)}`}>
        <Plus /> Create Post
      </Link>
    </Button>
  );

  if (resolvedIsOwner) {
    return (
      <div className='flex items-center gap-2'>
        <Button asChild type='button' variant='outline' size='sm'>
          <Link href={`/r/${encodeURIComponent(slug)}/settings`}>
            <Check /> Manage
          </Link>
        </Button>

        {renderCreatePost()}
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <Button
        type='button'
        variant={optimisticMember ? 'outline' : 'default'}
        size='sm'
        onClick={toggleMembership}
        isLoading={isSaving}
        loadingText='Saving…'
        className={optimisticMember ? undefined : 'celestia-primary-action'}
      >
        {optimisticMember ? <Check /> : <Plus />}
        {optimisticMember ? 'Joined' : 'Join'}
        {optimisticMember ? <UserMinus /> : null}
      </Button>

      {optimisticMember && renderCreatePost()}
    </div>
  );
};

export default CommunityMembershipButton;
