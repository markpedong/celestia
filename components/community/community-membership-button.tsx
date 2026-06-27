'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Plus, UserMinus } from 'lucide-react';
import Link from 'next/link';
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
  const isMember = useGetCommunityMember(slug).data?.data?.isMember ?? false;
  const { mutate, isPending } = useCommunityJoin();

  const resolvedIsOwner = Boolean(ownerID) && user?.id === ownerID;
  const resolvedIsSignedIn = session === undefined ? !!user : Boolean(session);

  if (!resolvedIsSignedIn) {
    return (
      <Button asChild size='sm' className='celestia-primary-action h-9 rounded px-3'>
        <Link href='/auth/sign-in'>Join community</Link>
      </Button>
    );
  }

  const toggleMembership = () => {
    mutate(slug);
  };

  const renderCreatePost = () => (
    <Button asChild size='sm' className='celestia-primary-action h-9 rounded px-3'>
      <Link href={`/submit?community=${encodeURIComponent(slug)}`}>
        <Plus /> Create Post
      </Link>
    </Button>
  );

  if (resolvedIsOwner) {
    return (
      <div className='flex flex-wrap items-center gap-2'>
        <Button asChild type='button' variant='outline' size='sm' className='h-9 rounded px-3'>
          <Link href={`/settings/communities/${encodeURIComponent(slug)}`}>
            <Check /> Manage
          </Link>
        </Button>

        {renderCreatePost()}
      </div>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        type='button'
        variant={isMember ? 'outline' : 'default'}
        size='sm'
        onClick={toggleMembership}
        isLoading={isPending}
        loadingText='Saving…'
        className={isMember ? 'h-9 rounded px-3' : 'celestia-primary-action h-9 rounded px-3'}
      >
        {isMember ? <Check /> : <Plus />}
        {isMember ? 'Joined' : 'Join'}
        {isMember ? <UserMinus /> : null}
      </Button>

      {isMember && renderCreatePost()}
    </div>
  );
};

export default CommunityMembershipButton;
