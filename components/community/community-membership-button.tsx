'use client';

import type { FC } from 'react';
import { setCommunityMembershipAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import type { CommunityMembershipButtonProps } from '@/lib/types';
import { Check, LoaderCircle, Plus, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export const CommunityMembershipButton: FC<CommunityMembershipButtonProps> = ({ slug, isMember, isSignedIn, isOwner = false, ownerId }: CommunityMembershipButtonProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { session, user } = useSession();
  const sessionUserId = user?.id ?? null;
  const [optimisticMember, setOptimisticMember] = useOptimistic(isMember, (_current, next: boolean) => next);
  const resolvedIsOwner = isOwner || (Boolean(ownerId) && sessionUserId === ownerId);
  const resolvedIsSignedIn = session === undefined ? isSignedIn : Boolean(session);

  if (!resolvedIsSignedIn) {
    return (
      <Button asChild size='sm' className='celestia-primary-action rounded-full'>
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
      <Button asChild type='button' variant='outline' size='sm' className='rounded-full'>
        <Link href={`/r/${encodeURIComponent(slug)}/settings`}>
          <Check className='size-3.5' /> Manage
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
      disabled={pending}
      className={optimisticMember ? 'rounded-full' : 'celestia-primary-action rounded-full'}
    >
      {pending ? <LoaderCircle className='size-3.5 animate-spin' /> : optimisticMember ? <Check className='size-3.5' /> : <Plus className='size-3.5' />}
      {pending ? 'Saving…' : optimisticMember ? 'Joined' : 'Join'}
      {optimisticMember && !pending ? <UserMinus className='size-3.5' /> : null}
    </Button>
  );
};
