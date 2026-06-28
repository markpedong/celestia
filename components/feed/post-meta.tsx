import type { FC } from 'react';
import { AuthorHoverCard } from '@/components/feed/author-hover-card';
import type { PostMetaProps } from '@/lib/types';
import { formatTimeAgo } from '@/lib/utils';
import { Clock } from 'lucide-react';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import styles from './post-meta.module.scss';

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
      className={classNames(
        styles.root,
        styles.defaultSize,
        {
          [styles.compact]: compact,
        },
        className
      )}
    >
      {displayAuthor.avatarUrl ? (
        <Image src={displayAuthor.avatarUrl} width={20} height={20} className={styles.avatar} alt='Avatar' />
      ) : (
        <span className={styles.avatarFallback}>
          {(displayAuthor.displayName ?? displayAuthor.userName).slice(0, 1).toUpperCase()}
        </span>
      )}
      {!author ? (
        <span className={styles.deletedAuthor}>u/user-deleted</span>
      ) : compact ? (
        <AuthorHoverCard author={author} authorStats={authorStats} />
      ) : (
        <Link href={`/u/${author.userName}`} className={styles.author}>
          {author.displayName ?? author.userName}
        </Link>
      )}
      <span className={styles.separator}>·</span>
      <span className={styles.timestamp}>
        <Clock className={styles.timestampIcon} />
        {formatTimeAgo(post.createdAt)}
      </span>
      {primaryTag ? (
        <>
          <span className={styles.separator}>·</span>
          <Link
            href={`/r/${encodeURIComponent(primaryTag.slug)}`}
            className={classNames(styles.tag, styles.defaultTag, {
              [styles.compactTag]: compact,
            })}
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
