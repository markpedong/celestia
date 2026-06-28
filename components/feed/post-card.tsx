import type { FC } from 'react';
import type { PostCardProps } from '@/lib/types';
import { MessageSquare, Share2, Sparkles } from 'lucide-react';
import classNames from 'classnames';
import Link from 'next/link';
import VoteButtons from './vote-buttons';
import { PostMeta } from './post-meta';
import PostImageGallery from '../post/post-image-gallery';
import styles from './post-card.module.scss';

const snippet = (body: string, max = 160) => {
  const t = body.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
};

const PostCard: FC<PostCardProps> = ({ post, author, authorStats, tagsBySlug, score, userVote, isSignedIn }) => {
  const hasImages = post.imageUrls.length > 0;

  return (
    <article className={classNames('celestia-card celestia-card-hover', styles.card)}>
      <div className={classNames('celestia-vote-rail', styles.voteRail)}>
        <VoteButtons target='post' targetID={post.id} score={score} userVote={userVote} isSignedIn={isSignedIn} />
      </div>
      <div className={styles.body}>
        <PostMeta
          author={author}
          authorStats={authorStats}
          post={post}
          tagsBySlug={tagsBySlug}
          compact
          className={styles.meta}
        />
        <Link href={`/post/${post.id}`} className={styles.link}>
          <h2 className={styles.title}>
            {post.title}
          </h2>
          <p className={styles.excerpt}>
            {snippet(post.body, hasImages ? 220 : 180)}
          </p>
        </Link>
        {hasImages ? (
          <PostImageGallery images={post.imageUrls} />
        ) : (
          <div className={styles.empty}>
            <Sparkles className={styles.emptyIcon} />
            Text discussion
          </div>
        )}
        <div className={styles.actions}>
          <Link
            href={`/post/${post.id}`}
            className={classNames('celestia-hover-surface', styles.action)}
          >
            <MessageSquare className='size-3.5' />
            {post.commentCount} comments
          </Link>
          <button
            type='button'
            className={classNames('celestia-hover-surface', styles.action)}
          >
            <Share2 className='size-3.5' />
            Share
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
