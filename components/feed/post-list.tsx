import type { PostListProps } from '@/lib/types';
import PostCard from './post-card';

export function PostList({ rows, authorsById, tagsBySlug }: PostListProps) {
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
            tagsBySlug={tagsBySlug}
            score={row.score}
            userVote={row.userVote}
          />
        );
      })}
    </>
  );
}
