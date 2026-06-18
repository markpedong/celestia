import { Post, Tag, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@neondatabase/auth/react';
import { Clock, MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/format';
import VoteButtons from './vote-buttons';

type Props = {
  post: Post;
  author: User;
  tagsBySlug: Map<string, Tag>;
  score: number;
  userVote: -1 | 0 | 1;
};

function snippet(body: string, max = 160) {
  const t = body.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const PostCard = ({ post, author, tagsBySlug, score, userVote }: Props) => {
  const primarySlug = post.tagSlugs[0];
  const primaryTag = primarySlug ? tagsBySlug.get(primarySlug) : undefined;

  return (
    <article className='celestia-card celestia-card-hover group overflow-hidden'>
      <div className='p-4 pb-3'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex min-w-0 items-center gap-2 text-xs text-muted-foreground'>
          <UserAvatar user={author} size='sm' />
          <Link href={`/post/${post.id}`} className='truncate text-sm font-medium text-muted-foreground hover:text-foreground'>
            {author.displayName ?? author.username}
          </Link>
          <span className='text-muted-foreground/40'>·</span>
          <span className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80'>
            <Clock className='size-3' />
            {formatRelativeTime(post.createdAt)}
          </span>
          </div>
          {primaryTag ? (
            <Link
              href={`/?tag=${encodeURIComponent(primaryTag.slug)}`}
              className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium')}
              style={{
                backgroundColor: `${primaryTag.hashColor}14`,
                borderColor: `${primaryTag.hashColor}30`,
                color: primaryTag.hashColor,
              }}
            >
              <span className='size-1 rounded-full shadow-[0_0_4px_currentColor]' style={{ background: primaryTag.hashColor }} />
              {primaryTag.label}
            </Link>
          ) : null}
        </div>
        <Link href={`/post/${post.id}`} className='block'>
          <h2 className='text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-white'>
            {post.title}
          </h2>
          <p className='mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground'>{snippet(post.body)}</p>
        </Link>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border/70 px-4 py-2.5'>
        <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} />
        <div className='flex items-center gap-1 text-xs font-medium text-muted-foreground'>
          <Link href={`/post/${post.id}`} className='celestia-subtle-action inline-flex items-center gap-1.5 px-2.5 py-1.5'>
            <MessageSquare className='size-4' />
            {post.commentCount}
          </Link>
          <button type='button' className='celestia-subtle-action inline-flex items-center gap-1.5 px-2.5 py-1.5'>
            <Share2 className='size-4' />
            Share
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
