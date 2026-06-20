import { UserAvatar } from '@/components/ui/user-avatar';
import { formatRelativeTime } from '@/lib/format';
import type { PostMetaProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export function PostMeta({ author, post, tagsBySlug, className, compact = false }: PostMetaProps) {
  const primarySlug = post.tagSlugs[0];
  const primaryTag = primarySlug ? tagsBySlug.get(primarySlug) : undefined;

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-muted-foreground', compact ? 'text-xs' : 'text-sm', className)}>
      <UserAvatar user={author} size='sm' />
      <Link href={`/u/${author.username}`} className={cn('font-medium text-card-foreground hover:text-primary', compact && 'truncate text-xs')}>
        {author.displayName ?? author.username}
      </Link>
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
}
