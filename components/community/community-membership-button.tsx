'use client';

import type { FC } from 'react';
import { getCommunityMembershipAction, setCommunityMembershipAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import type { CommunityMembershipButtonProps } from '@/lib/types';
import { Check, Plus, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useGetProfile } from '@/hooks/useQueries';

export const CommunityMembershipButton: FC<CommunityMembershipButtonProps> = ({
  slug,
  isMember = false,
  isSignedIn = false,
  isOwner = false,
  ownerId,
  showCreatePost = false,
}) => {
  const user = useGetProfile().data?.data;
  const router = useRouter();
  const session = useSession().session;
  const [pending, startTransition] = useTransition();
  const [member, setMember] = useState(isMember);

  const resolvedIsOwner = isOwner || (Boolean(ownerId) && user?.id === ownerId);
  const resolvedIsSignedIn = session === undefined ? isSignedIn : Boolean(session);

  useEffect(() => {
    if (session) void getCommunityMembershipAction(slug).then(({ isMember: nextMember }) => setMember(nextMember));
  }, [session, slug]);

  if (!resolvedIsSignedIn) {
    return (
      <Button asChild size='sm' className='celestia-primary-action'>
        <Link href='/auth/sign-in'>Join community</Link>
      </Button>
    );
  }

  const toggleMembership = () => {
    const nextMembership = !member;
    startTransition(async () => {
      setMember(nextMembership);
      const result = await setCommunityMembershipAction(slug, nextMembership);
      if (result.error) {
        setMember(!nextMembership);
        router.refresh();
      }
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
    <div className='flex items-center gap-2'>
      <Button
      type='button'
      variant={member ? 'outline' : 'default'}
      size='sm'
      onClick={toggleMembership}
      isLoading={pending}
      loadingText='Saving…'
      className={member ? undefined : 'celestia-primary-action'}
    >
      {member ? <Check /> : <Plus />}
      {member ? 'Joined' : 'Join'}
      {member ? <UserMinus /> : null}
      </Button>
      {member && showCreatePost ? (
        <Button asChild size='sm' className='celestia-primary-action'>
          <Link href={`/submit?community=${encodeURIComponent(slug)}`}><Plus />Create Post</Link>
        </Button>
      ) : null}
    </div>
  );
};
