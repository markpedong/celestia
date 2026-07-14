import { EyeOff } from 'lucide-react';
import { redirect } from 'next/navigation';
import { PostList } from '@/components/feed/post-list';
import { EmptyState } from '@/components/ui/empty-state';
import { getSessionUser } from '@/lib/auth';
import { listCommunity } from '@/lib/db/community.queries';
import { listContentActions } from '@/lib/db/content.queries';
import { listPostsByIDs } from '@/lib/db/post.queries';
import { batchAuthorsForIDs, batchUserStatsForIDs } from '@/lib/db/user.queries';

const HiddenPage = async () => {
  const user = await getSessionUser();
  if (!user) redirect('/auth/sign-in');
  const actions = await listContentActions(user.id, 'hidden');
  const [rows, tags] = await Promise.all([
    listPostsByIDs(actions.map(action => action.targetID), user.id),
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
        <p className='celestia-panel-label'><EyeOff className='size-3' /> Preferences</p>
        <h1 className='mt-2 text-3xl font-black tracking-tight'>Hidden posts</h1>
        <p className='mt-2 text-sm text-muted-foreground'>Hidden posts stay out of your main feeds. Open one to unhide it.</p>
      </header>
      {rows.length ? (
        <PostList
          rows={rows}
          authorsByID={authorsByID}
          authorStatsByID={authorStatsByID}
          tagsBySlug={new Map(tags.map(tag => [tag.slug, tag]))}
          isSignedIn
        />
      ) : (
        <EmptyState icon={EyeOff} title='No hidden posts' description='Posts you hide will appear here.' />
      )}
    </main>
  );
};

export default HiddenPage;
