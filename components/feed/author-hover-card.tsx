'use client';

import type { FC } from 'react';
import Link from 'next/link';
import { CalendarDays, CirclePlus, MessageCircle } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useContentAction, useStartDirectConversation } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';
import { authorActionState } from '@/lib/author-action-state';
import type { User, UserStats } from '@/lib/types';
import { formatCount, formatTimeAgo } from '@/lib/utils';

type AuthorHoverCardProps = {
  author: User;
  authorStats?: UserStats;
};

const actionClassName = 'inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

export const AuthorHoverCard: FC<AuthorHoverCardProps> = ({ author, authorStats }) => {
  const authorName = author.displayName ?? author.userName;
  const { session } = useSession();
  const { query, mutation: followMutation } = useContentAction('followed', 'user', author.id);
  const startDirectConversation = useStartDirectConversation();
  const state = authorActionState(session === undefined ? undefined : session?.user.id ?? null, author.id);
  const isFollowing = query.data?.data?.active ?? false;
  const loginHref = `/auth/sign-in?next=${encodeURIComponent(`/u/${author.userName}`)}`;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span tabIndex={0} className='truncate text-xs font-medium text-card-foreground outline-none focus-visible:text-primary'>
          {authorName}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className='w-96 p-6'>
        <div className='flex items-center gap-3'>
          <UserAvatar user={author} size='lg' className='size-14' />
          <div className='min-w-0'>
            <Link href={`/u/${author.userName}`} className='block truncate text-lg font-bold leading-tight transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none'>
              {authorName}
            </Link>
            {author.createdAt && (
              <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                <CalendarDays className='size-3.5' /> {formatTimeAgo(author.createdAt)}
              </p>
            )}
          </div>
        </div>
        <div className='mt-5 grid grid-cols-2 gap-6'>
          <div>
            <p className='text-xl font-medium leading-none'>{formatCount(authorStats?.karma ?? 0)}</p>
            <p className='mt-1 text-sm text-muted-foreground'>Post karma</p>
          </div>
          <div>
            <p className='text-xl font-medium leading-none'>{formatCount(authorStats?.commentKarma ?? 0)}</p>
            <p className='mt-1 text-sm text-muted-foreground'>Comment karma</p>
          </div>
        </div>
        {state === 'loading' && <p className='mt-5 text-sm text-muted-foreground' aria-live='polite'>Loading actions…</p>}
        {state === 'guest' && (
          <div className='mt-5 flex gap-2'>
            <Link href={loginHref} className={`${actionClassName} bg-primary text-primary-foreground hover:bg-primary/90`}>
              <CirclePlus className='size-4' /> Follow
            </Link>
            <Link href={loginHref} className={`${actionClassName} bg-muted text-foreground hover:bg-muted/80`}>
              <MessageCircle className='size-4' /> Start Chat
            </Link>
          </div>
        )}
        {state === 'ready' && (
          <>
            <div className='mt-5 flex gap-2'>
              <button
                type='button'
                disabled={query.isPending || query.isError || followMutation.isPending}
                aria-pressed={isFollowing}
                aria-busy={query.isPending || followMutation.isPending}
                className={`${actionClassName} bg-primary text-primary-foreground hover:bg-primary/90`}
                onClick={() => followMutation.mutate(!isFollowing)}
              >
                <CirclePlus className='size-4' /> {followMutation.isPending ? 'Saving…' : query.isPending ? 'Loading…' : isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                type='button'
                disabled={startDirectConversation.isPending}
                aria-busy={startDirectConversation.isPending}
                className={`${actionClassName} bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground`}
                onClick={() => startDirectConversation.mutate(author)}
              >
                <MessageCircle className='size-4' /> {startDirectConversation.isPending ? 'Starting…' : 'Start Chat'}
              </button>
            </div>
            {query.isError && (
              <p role='alert' className='mt-3 text-xs text-destructive'>
                Unable to load follow status.{' '}
                <button type='button' className='underline' onClick={() => void query.refetch()}>Retry</button>
              </p>
            )}
            {(startDirectConversation.isError || startDirectConversation.data && !startDirectConversation.data.success) && (
              <p role='alert' className='mt-3 text-xs text-destructive'>Unable to start the chat. Please try again.</p>
            )}
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};
