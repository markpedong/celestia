'use client';

import { CirclePlus, MessageCircleMore } from 'lucide-react';
import Link from 'next/link';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { useGetProfile, useStartDirectConversation } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';
import type { User } from '@/lib/types';

export const ClientProfileControls = ({ profile, className }: { profile: User; className?: string }) => {
  const { session } = useSession();
  const { data } = useGetProfile();
  const startDirectConversation = useStartDirectConversation();
  const user = data?.data;
  const isSignedIn = session === undefined ? Boolean(user) : Boolean(session);
  const isSelf = user?.id === profile.id;

  if (session === undefined) return null;

  if (isSelf) return null;

  if (!isSignedIn) {
    return (
      <div className={classNames('grid grid-cols-2 gap-2', className)}>
        <Button
          className='h-9 rounded-full border-0 bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_srgb,var(--primary)_28%,transparent)] disabled:opacity-100'
          disabled
        >
          <CirclePlus />
          Follow
        </Button>
        <Button
          asChild
          className='h-9 rounded-full border-0 bg-secondary px-3 text-sm font-semibold text-secondary-foreground hover:bg-muted'
        >
          <Link href='/auth/sign-in'>
            <MessageCircleMore />
            Chat
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={classNames('grid grid-cols-2 gap-2', className)}>
      <Button
        className='h-9 rounded-full border-0 bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_srgb,var(--primary)_28%,transparent)] disabled:opacity-100'
        disabled
      >
        <CirclePlus />
        Follow
      </Button>
      <Button
        className='h-9 rounded-full border-0 bg-secondary px-3 text-sm font-semibold text-secondary-foreground hover:bg-muted'
        onClick={() => startDirectConversation.mutate(profile)}
      >
        <MessageCircleMore />
        Chat
      </Button>
    </div>
  );
};
