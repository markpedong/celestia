import type { FC } from 'react';
import { AuthorHoverCard } from '@/components/feed/author-hover-card';
import type { PostMetaProps } from '@/lib/types';
import { cn, formatTimeAgo } from '@/lib/utils';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const PostMeta: FC<PostMetaProps> = ({ author, authorStats, post, tagsBySlug, className, compact = false, afterTag }) => {
  const primarySlug = post.tagSlugs[0];
  const primaryTag = primarySlug ? tagsBySlug.get(primarySlug) : undefined;
  const displayAuthor = author ?? {
    id: 'user-deleted',
    userName: 'user-deleted',
    email: '',
    displayName: 'u/user-deleted',
    bio: null,
    avatarUrl: null,
    coverUrl: null,
    createdAt: new Date(0),
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 text-muted-foreground',
        compact ? 'text-xs' : 'text-sm',
        className
      )}
    >
      {displayAuthor.avatarUrl ? (
        <Image src={displayAuthor.avatarUrl} width={20} height={20} className='rounded-full size-5' alt='Avatar' />
      ) : (
        <span className='grid size-5 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary'>
          {(displayAuthor.displayName ?? displayAuthor.userName).slice(0, 1).toUpperCase()}
        </span>
      )}
      {!author ? (
        <span className='font-medium text-muted-foreground'>u/user-deleted</span>
      ) : compact ? (
        <AuthorHoverCard author={author} authorStats={authorStats} />
      ) : (
        <Link href={`/u/${author.userName}`} className='font-medium text-card-foreground hover:text-primary'>
          {author.displayName ?? author.userName}
        </Link>
      )}
      <span className='text-muted-foreground/40'>·</span>
      <span className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80'>
        <Clock className='size-3' />
        {formatTimeAgo(post.createdAt)}
      </span>
      {primaryTag ? (
        <>
          <span className='text-muted-foreground/40'>·</span>
          <Link
            href={`/r/${encodeURIComponent(primaryTag.slug)}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-semibold',
              compact ? 'text-[11px]' : 'text-xs'
            )}
            style={{
              backgroundColor: `${primaryTag.hashColor}18`,
              borderColor: `${primaryTag.hashColor}38`,
              color: primaryTag.hashColor,
            }}
          >
            {primaryTag.label}
          </Link>
          {afterTag}
        </>
      ) : null}
    </div>
  );
};
