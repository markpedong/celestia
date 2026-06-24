'use client';

import type { FC } from 'react';
import { setCommunityMembershipAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import type { CommunityMembershipButtonProps } from '@/lib/types';
import { Check, Plus, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useGetProfile } from '@/hooks/useQueries';

export const CommunityMembershipButton: FC<CommunityMembershipButtonProps> = ({
  slug,
  isMember,
  isSignedIn,
  isOwner = false,
  ownerId,
}) => {
  const user = useGetProfile().data?.data;
  const router = useRouter();
  const session = useSession().session;
  const [pending, startTransition] = useTransition();
  const [optimisticMember, setOptimisticMember] = useOptimistic(isMember, (_current, next: boolean) => next);

  const resolvedIsOwner = isOwner || (Boolean(ownerId) && user?.id === ownerId);
  const resolvedIsSignedIn = session === undefined ? isSignedIn : Boolean(session);

  if (!resolvedIsSignedIn) {
    return (
      <Button asChild size='sm' className='celestia-primary-action'>
        <Link href='/auth/sign-in'>Join community</Link>
      </Button>
    );
  }

  const toggleMembership = () => {
    const nextMembership = !optimisticMember;
    startTransition(async () => {
      setOptimisticMember(nextMembership);
      const result = await setCommunityMembershipAction(slug, nextMembership);
      if (result.error) router.refresh();
    });
  };

  if (resolvedIsOwner) {
    return (
      <Button asChild type='button' variant='outline' size='sm'>
        <Link href={`/r/${encodeURIComponent(slug)}/settings`}>
          <Check /> Manage
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type='button'
      variant={optimisticMember ? 'outline' : 'default'}
      size='sm'
      onClick={toggleMembership}
      isLoading={pending}
      loadingText='Saving…'
      className={optimisticMember ? undefined : 'celestia-primary-action'}
    >
      {optimisticMember ? (
        <Check />
      ) : (
        <Plus />
      )}
      {optimisticMember ? 'Joined' : 'Join'}
      {optimisticMember ? <UserMinus /> : null}
    </Button>
  );
};
