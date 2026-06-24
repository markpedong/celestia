import type { FC } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { AuthorHoverCard } from '@/components/feed/author-hover-card';
import { formatRelativeTime } from '@/lib/format';
import type { PostMetaProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export const PostMeta: FC<PostMetaProps> = ({ author, authorStats, post, tagsBySlug, className, compact = false }) => {
  const primarySlug = post.tagSlugs[0];
  const primaryTag = primarySlug ? tagsBySlug.get(primarySlug) : undefined;
  const displayAuthor = author ?? {
    id: 'user-deleted',
    username: 'user-deleted',
    email: '',
    displayName: 'u/user-deleted',
    bio: null,
    avatarUrl: null,
    coverUrl: null,
    createdAt: new Date(0),
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-muted-foreground', compact ? 'text-xs' : 'text-sm', className)}>
      <UserAvatar user={displayAuthor} size='sm' />
      {!author ? (
        <span className='font-medium text-muted-foreground'>u/user-deleted</span>
      ) : compact ? (
        <AuthorHoverCard author={author} authorStats={authorStats} />
      ) : (
        <Link href={`/u/${author.username}`} className='font-medium text-card-foreground hover:text-primary'>
          {author.displayName ?? author.username}
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
