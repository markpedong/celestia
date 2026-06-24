import type { FC } from 'react';
import type { PostListProps } from '@/lib/types';
import PostCard from './post-card';

export const PostList: FC<PostListProps> = ({ rows, authorsByID, authorStatsByID, tagsBySlug, isSignedIn }) => {
  return (
    <>
      {rows.map(row => {
        const author = authorsByID.get(row.post.authorID);

        return (
          <PostCard
            key={row.post.id}
            post={row.post}
            author={author}
            authorStats={authorStatsByID.get(row.post.authorID) ?? { postCount: 0, commentCount: 0, karma: 0, commentKarma: 0 }}
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
