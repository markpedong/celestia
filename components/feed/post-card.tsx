import { Post, Tag, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@neondatabase/auth/react';
import { Bookmark, Clock, MessageSquare, Share2 } from 'lucide-react';
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
    <article className='celestia-card celestia-card-hover group flex overflow-hidden'>
      <div className='flex min-w-[52px] flex-col items-center justify-center border-r border-border/60 bg-black/15 px-3 py-4'>
        <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} />
      </div>
      <div className='flex min-w-0 flex-1 gap-4 p-4'>
        <div className='min-w-0 flex-1'>
          <div className='mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <UserAvatar user={author} size='sm' />
            <Link href={`/post/${post.id}`} className='truncate text-xs font-medium text-slate-300 hover:text-foreground'>
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
                  href={`/?tag=${encodeURIComponent(primaryTag.slug)}`}
                  className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold')}
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
          <Link href={`/post/${post.id}`} className='block'>
            <h2 className='text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-violet-100'>
              {post.title}
            </h2>
            <p className='mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground'>{snippet(post.body)}</p>
          </Link>
          <div className='mt-3 flex items-center gap-3 text-xs font-medium text-muted-foreground'>
            <Link href={`/post/${post.id}`} className='inline-flex items-center gap-1 transition-colors hover:text-cyan-300'>
              <MessageSquare className='size-3.5' />
              {post.commentCount}
            </Link>
            <button type='button' className='inline-flex items-center gap-1 transition-colors hover:text-primary'>
              <Share2 className='size-3.5' />
              Share
            </button>
            <button type='button' className='ml-auto inline-flex items-center gap-1 transition-colors hover:text-primary' aria-label='Bookmark signal'>
              <Bookmark className='size-3.5' />
            </button>
          </div>
        </div>
        <Link
          href={`/post/${post.id}`}
          className='celestia-orbit-thumb hidden h-20 w-28 shrink-0 self-center rounded-xl border border-border/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] sm:block'
          aria-label={post.title}
        />
      </div>
    </article>
  );
};

export default PostCard;
