'use client';

import type { FC } from 'react';
import Link from 'next/link';
import { CalendarDays, CirclePlus, MessageCircle } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { User, UserStats } from '@/lib/types';
import { formatCount, formatTimeAgo } from '@/lib/utils';

type AuthorHoverCardProps = {
  author: User;
  authorStats?: UserStats;
};

export const AuthorHoverCard: FC<AuthorHoverCardProps> = ({ author, authorStats }) => {
  const authorName = author.displayName ?? author.userName;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span
          tabIndex={0}
          className='truncate text-xs font-medium text-card-foreground outline-none focus-visible:text-primary'
        >
          {authorName}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className='w-96 p-6'>
        <div className='flex items-center gap-3'>
          <UserAvatar user={author} size='lg' className='size-14' />
          <div className='min-w-0'>
            <Link
              href={`/u/${author.userName}`}
              className='block truncate text-lg font-bold leading-tight transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none'
            >
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
        <div className='mt-5 flex gap-2'>
          <button
            type='button'
            disabled
            className='inline-flex h-9 items-center gap-2 rounded-lg bg-primary/20 px-4 text-sm font-semibold text-primary-foreground opacity-70'
          >
            <CirclePlus className='size-4' /> Follow
          </button>
          <button
            type='button'
            disabled
            className='inline-flex h-9 items-center gap-2 rounded-lg bg-muted px-4 text-sm font-semibold text-muted-foreground opacity-70'
          >
            <MessageCircle className='size-4' /> Start Chat
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
