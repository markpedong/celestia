'use client';

import type { FC } from 'react';
import { setCommunityMembershipAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import type { CommunityMembershipButtonProps } from '@/lib/types';
import { Check, LoaderCircle, Plus, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export const CommunityMembershipButton: FC<CommunityMembershipButtonProps> = ({ slug, isMember, isSignedIn, isOwner = false }: CommunityMembershipButtonProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticMember, setOptimisticMember] = useOptimistic(isMember, (_current, next: boolean) => next);

  if (!isSignedIn) {
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

  if (isOwner) {
    return (
      <Button type='button' variant='outline' size='sm' disabled className='rounded-full opacity-100'>
        <Check className='size-3.5' /> Owner
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
