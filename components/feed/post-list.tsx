import type { FeedPostRow } from '@/lib/db/queries';
import type { Tag, User } from '@/lib/types';
import PostCard from './post-card';

type Props = {
  rows: FeedPostRow[];
  authorsById: Map<string, User>;
  tagsBySlug: Map<string, Tag>;
};

export function PostList({ rows, authorsById, tagsBySlug }: Props) {
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
