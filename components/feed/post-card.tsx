import type { FC } from 'react';
import type { PostCardProps } from '@/lib/types';
import { MessageSquare, Share2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import VoteButtons from './vote-buttons';
import { PostMeta } from './post-meta';
import { PostImageGallery } from '../post/post-image-gallery';

const snippet = (body: string, max = 160) => {
  const t = body.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
};

const PostCard: FC<PostCardProps> = ({ post, author, authorStats, tagsBySlug, score, userVote, isSignedIn }) => {
  const hasImages = post.imageUrls.length > 0;

  return (
    <article className='celestia-card celestia-card-hover flex w-full overflow-hidden last:mb-7'>
      <div className='celestia-vote-rail flex min-w-[50px] flex-col items-center justify-start border-r border-border/60 px-2.5 py-4'>
        <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} isSignedIn={isSignedIn} />
      </div>
      <div className='min-w-0 flex-1 p-4 md:p-5'>
        <PostMeta author={author} authorStats={authorStats} post={post} tagsBySlug={tagsBySlug} compact className='mb-2' />
        <Link href={`/post/${post.id}`} className='group/post-link block'>
          <h2 className='text-[15px] font-bold leading-snug text-foreground transition-colors hover:text-primary md:text-base'>
            {post.title}
          </h2>
          <p className='mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground'>{snippet(post.body, hasImages ? 220 : 180)}</p>
        </Link>
        {hasImages ? (
          <PostImageGallery imageUrls={post.imageUrls} title={post.title} variant='feed' />
        ) : (
          <div className='mt-4 rounded border border-dashed border-border/70 bg-muted/25 px-3 py-2 text-xs text-muted-foreground'>
            <Sparkles className='mr-1.5 inline size-3.5 text-primary' />
            Text discussion
          </div>
        )}
        <div className='mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground'>
          <Link
            href={`/post/${post.id}`}
            className='inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors celestia-hover-surface'
          >
            <MessageSquare className='size-3.5' />
            {post.commentCount} comments
          </Link>
          <button type='button' className='inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors celestia-hover-surface'>
            <Share2 className='size-3.5' />
            Share
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
