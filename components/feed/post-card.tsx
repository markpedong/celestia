import type { FC } from 'react';
import type { PostCardProps } from '@/lib/types';
import { MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';
import VoteButtons from './vote-buttons';
import { PostMeta } from './post-meta';
import { PostImageGallery } from '../post/post-image-gallery';

const snippet = (body: string, max = 160) => {
  const t = body.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
};

const PostCard: FC<PostCardProps> = ({ post, author, tagsBySlug, score, userVote }: PostCardProps) => {
  return (
    <article className='celestia-card celestia-card-hover flex w-full overflow-hidden last:mb-7'>
      <div className='celestia-vote-rail flex min-w-[52px] flex-col items-center justify-center border-r border-border/60 px-3 py-4'>
        <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} />
      </div>
      <div className='flex min-w-0 flex-1 gap-4 p-4'>
        <div className='min-w-0 flex-1'>
          <PostMeta author={author} post={post} tagsBySlug={tagsBySlug} compact className='mb-2' />
          <Link href={`/post/${post.id}`} className='group/post-link block'>
            <h2 className='text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary'>
              {post.title}
            </h2>
            <p className='mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground'>{snippet(post.body)}</p>
          </Link>
          <div className='mt-3 flex items-center gap-3 text-xs font-medium text-muted-foreground'>
            <Link
              href={`/post/${post.id}`}
              className='inline-flex items-center gap-1 transition-colors hover:text-accent'
            >
              <MessageSquare className='size-3.5' />
              {post.commentCount}
            </Link>
            <button type='button' className='inline-flex items-center gap-1 transition-colors hover:text-primary'>
              <Share2 className='size-3.5' />
              Share
            </button>
          </div>
        </div>
        <PostImageGallery imageUrls={post.imageUrls} title={post.title} variant='thumbnail' />
      </div>
    </article>
  );
};

export default PostCard;
