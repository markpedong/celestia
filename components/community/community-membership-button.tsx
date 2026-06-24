'use client';

import type { FC } from 'react';
import { getCommunityMembershipAction, setCommunityMembershipAction } from '@/lib/actions/communities';
import { Button } from '@/components/ui/button';
import { Check, Plus, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useGetProfile } from '@/hooks/useQueries';

const CommunityMembershipButton: FC<{ ownerID: string }> = ({ ownerID }) => {
  const slug = usePathname().split('/').pop() ?? '';
  const user = useGetProfile().data?.data;
  const router = useRouter();
  const session = useSession().session;
  const [pending, startTransition] = useTransition();
  const [member, setMember] = useState(false);

  const resolvedIsOwner = Boolean(ownerID) && user?.id === ownerID;
  const resolvedIsSignedIn = session === undefined ? !!user : Boolean(session);

  useEffect(() => {
    // That determines whether the button displays Join or Joined—and whether to show Create Post for a joined member.
    if (session && slug) void getCommunityMembershipAction(slug).then(({ isMember }) => setMember(isMember));
  }, [session, slug]);

  if (!resolvedIsSignedIn) {
    return (
      <Button asChild size='sm' className='celestia-primary-action'>
        <Link href='/auth/sign-in'>Join community</Link>
      </Button>
    );
  }

  const toggleMembership = () => {
    startTransition(async () => {
      setMember(!member);
      const result = await setCommunityMembershipAction(slug, !member);
      if (result.error) {
        setMember(!!member);
        router.refresh();
      }
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
      {member && renderCreatePost()}
    </div>
  );
};

export default CommunityMembershipButton;
