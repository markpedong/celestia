import type { FC } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { formatCount, formatRelativeTime } from '@/lib/format';
import type { PostMetaProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CalendarDays, CirclePlus, Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export const PostMeta: FC<PostMetaProps> = ({ author, authorStats, post, tagsBySlug, className, compact = false }: PostMetaProps) => {
  const primarySlug = post.tagSlugs[0];
  const primaryTag = primarySlug ? tagsBySlug.get(primarySlug) : undefined;
  const authorName = author.displayName ?? author.username;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-muted-foreground', compact ? 'text-xs' : 'text-sm', className)}>
      <UserAvatar user={author} size='sm' />
      {compact ? (
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
                <Link
                  href={`/u/${author.username}`}
                  className='block truncate text-lg font-bold leading-tight transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none'
                >
                  {authorName}
                </Link>
                {author.createdAt ? (
                  <p className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                    <CalendarDays className='size-3.5' /> {new Date(author.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                ) : null}
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
            {author.createdAt ? (
              <p className='mt-5 text-sm text-muted-foreground'>Member for {formatRelativeTime(author.createdAt)}</p>
            ) : null}
            <div className='mt-5 flex gap-2'>
              <button type='button' disabled className='inline-flex h-9 items-center gap-2 rounded-full bg-primary/20 px-4 text-sm font-semibold text-primary-foreground opacity-70'>
                <CirclePlus className='size-4' /> Follow
              </button>
              <button type='button' disabled className='inline-flex h-9 items-center gap-2 rounded-full bg-muted px-4 text-sm font-semibold text-muted-foreground opacity-70'>
                <MessageCircle className='size-4' /> Start Chat
              </button>
            </div>
          </HoverCardContent>
        </HoverCard>
      ) : (
        <Link href={`/u/${author.username}`} className='font-medium text-card-foreground hover:text-primary'>
          {authorName}
        </Link>
      )}
      <span className='text-muted-foreground/40'>·</span>
      <span className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80'>
        <Clock className='size-3' />
        {formatRelativeTime(post.createdAt)}
      </span>
      {primaryTag ? (
        <>
          <span className='text-muted-foreground/40'>·</span>
          <Link
            href={`/r/${encodeURIComponent(primaryTag.slug)}`}
            className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-semibold', compact ? 'text-[11px]' : 'text-xs')}
            style={{
              backgroundColor: `${primaryTag.hashColor}18`,
              borderColor: `${primaryTag.hashColor}38`,
              color: primaryTag.hashColor,
            }}
          >
            {primaryTag.label}
          </Link>
        </>
      ) : null}
    </div>
  );
};
