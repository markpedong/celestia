'use client';

import { MessageCircleMore } from 'lucide-react';
import Link from 'next/link';
import classNames from 'classnames';
import { Button } from '@/components/ui/button';
import { useGetProfile, useStartDirectConversation } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';
import type { User } from '@/lib/types';
import { ContentActionButton } from '@/components/ui/content-action-button';
import { ReportButton } from '@/components/ui/report-button';

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
        <ContentActionButton
          kind='followed'
          targetType='user'
          targetID={profile.id}
          className='inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground'
        />
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
      <ContentActionButton
        kind='followed'
        targetType='user'
        targetID={profile.id}
        className='inline-flex h-9 items-center justify-center gap-2 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground'
      />
      <Button
        className='h-9 rounded-full border-0 bg-secondary px-3 text-sm font-semibold text-secondary-foreground hover:bg-muted'
        onClick={() => startDirectConversation.mutate(profile)}
      >
        <MessageCircleMore />
        Chat
      </Button>
      <ReportButton
        targetType='user'
        targetID={profile.id}
        className='col-span-2 inline-flex h-8 items-center justify-center gap-2 rounded-full text-xs text-muted-foreground hover:bg-muted'
      />
    </div>
  );
};
