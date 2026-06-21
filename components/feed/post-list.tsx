import type { FC } from 'react';
import type { PostListProps } from '@/lib/types';
import PostCard from './post-card';

export const PostList: FC<PostListProps> = ({ rows, authorsById, authorStatsById, tagsBySlug, isSignedIn }: PostListProps) => {
  return (
    <>
      {rows.map(row => {
        const author = authorsById.get(row.post.authorId);
        if (!author) return null;

        return (
          <PostCard
            key={row.post.id}
            post={row.post}
            author={author}
            authorStats={authorStatsById.get(row.post.authorId) ?? { postCount: 0, commentCount: 0, karma: 0, commentKarma: 0 }}
            tagsBySlug={tagsBySlug}
            score={row.score}
            userVote={row.userVote}
            isSignedIn={isSignedIn}
          />
        );
      })}
    </>
  );
};
