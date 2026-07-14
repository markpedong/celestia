import Link from 'next/link';
import { Bookmark, MessageSquare } from 'lucide-react';
import { redirect } from 'next/navigation';
import { PostList } from '@/components/feed/post-list';
import { EmptyState } from '@/components/ui/empty-state';
import { getSessionUser } from '@/lib/auth';
import { listComments } from '@/lib/db/comment.queries';
import { listCommunity } from '@/lib/db/community.queries';
import { listContentActions } from '@/lib/db/content.queries';
import { listPostsByIDs } from '@/lib/db/post.queries';
import { batchAuthorsForIDs, batchUserStatsForIDs } from '@/lib/db/user.queries';
import { formatTimeAgo } from '@/lib/utils';

const SavedPage = async () => {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');

  const actions = await listContentActions(user.id, 'saved');
  const postIDs = actions.filter(action => action.targetType === 'post').map(action => action.targetID);
  const commentIDs = actions.filter(action => action.targetType === 'comment').map(action => action.targetID);
  const [rows, comments, tags] = await Promise.all([
    listPostsByIDs(postIDs, user.id),
    commentIDs.length ? listComments({ id: { in: commentIDs } }) : [],
    listCommunity(),
  ]);
  const authorIDs = rows.map(row => row.post.authorID);
  const [authorsByID, authorStatsByID] = await Promise.all([
    batchAuthorsForIDs(authorIDs),
    batchUserStatsForIDs(authorIDs),
  ]);

  return (
    <main className='mx-auto w-full max-w-4xl space-y-5 px-4 py-6 md:py-10'>
      <header>
        <p className='celestia-panel-label'><Bookmark className='size-3' /> Library</p>
        <h1 className='mt-2 text-3xl font-black tracking-tight'>Saved content</h1>
        <p className='mt-2 text-sm text-muted-foreground'>Posts and comments you saved for later.</p>
      </header>
      {rows.length ? (
        <section className='space-y-3'>
          <h2 className='text-sm font-semibold'>Posts</h2>
          <PostList
            rows={rows}
            authorsByID={authorsByID}
            authorStatsByID={authorStatsByID}
            tagsBySlug={new Map(tags.map(tag => [tag.slug, tag]))}
            isSignedIn
          />
        </section>
      ) : null}
      {comments.length ? (
        <section className='celestia-card p-4'>
          <h2 className='mb-3 flex items-center gap-2 text-sm font-semibold'><MessageSquare className='size-4' /> Comments</h2>
          <div className='space-y-2'>
            {comments.map(comment => (
              <Link key={comment.id} href={`/post/${comment.postID}#comment-${comment.id}`} className='block rounded border border-border bg-muted/30 p-3 celestia-hover-surface'>
                <p className='truncate text-xs font-semibold text-primary'>{comment.postTitle}</p>
                <p className='mt-1 line-clamp-3 text-sm leading-6'>{comment.body}</p>
                <p className='mt-2 font-mono text-[11px] text-muted-foreground'>{formatTimeAgo(comment.createdAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {!rows.length && !comments.length ? (
        <EmptyState icon={Bookmark} title='Nothing saved yet' description='Use Save on a post or comment to add it here.' />
      ) : null}
    </main>
  );
};

export default SavedPage;
