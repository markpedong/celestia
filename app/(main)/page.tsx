import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import { PostList } from '@/components/feed/post-list';
import { RightTrending } from '@/components/layout/right-trending';
import { EmptyState } from '@/components/ui/empty-state';
import { getSessionUser } from '@/lib/auth';
import { batchAuthorsForIds, listPostSorted, listTags, tagsPostCounts } from '@/lib/db/queries';
import { getTrendingToday } from '@/lib/trending';
import { FeedSort } from '@/lib/types';
import { FileQuestion } from 'lucide-react';
import { FC } from 'react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const Home: FC<Props> = async ({ searchParams }) => {
  const sessionUser = await getSessionUser();
  const query = await searchParams;

  const rawSort = (Array.isArray(query.sort) ? query.sort[0] : query.sort) as FeedSort | undefined;
  const sort: FeedSort = rawSort === 'new' || rawSort === 'top' ? rawSort : 'hot';
  const tag = Array.isArray(query.tag) ? query.tag[0] : query.tag;
  const tagFilter = tag?.toLowerCase() ?? '';
  const searchQuery = Array.isArray(query.q) ? query.q[0] ?? '' : query.q ?? '';
  const cleanedSearchQuery = searchQuery.trim();

  const rows = await listPostSorted(sort, tagFilter, sessionUser?.id, cleanedSearchQuery);
  const tags = await listTags();
  const tagsMap = new Map(tags.map(t => [t.slug, t]));
  const authorIds = [...new Set(rows.map(row => row.post.authorId))];
  const authorById = await batchAuthorsForIds(authorIds);

  const trending = getTrendingToday();
  const communities = (await tagsPostCounts())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));

  return (
    <div className='flex w-full min-w-0 gap-6'>
      <div className='w-full min-w-0 flex-1'>
        <FeedSortTabs current={sort} tag={tagFilter} query={cleanedSearchQuery} />
        {cleanedSearchQuery ? (
          <div className='mb-4 rounded-xl border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
            Showing results for <span className='font-semibold text-foreground'>&quot;{cleanedSearchQuery}&quot;</span>
          </div>
        ) : null}
        <div className='w-full space-y-3'>
          <PostList rows={rows} authorsById={authorById} tagsBySlug={tagsMap} />
          {rows.length === 0 && (
            <EmptyState
              icon={FileQuestion}
              title={cleanedSearchQuery ? 'No matching posts found' : 'No posts here yet'}
              description={cleanedSearchQuery ? 'Try a different keyword or clear the search.' : 'Be the first to start a discussion.'}
              className='flex min-h-80 w-full flex-col items-center justify-center py-20'
            />
          )}
        </div>
      </div>
      <aside className='sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 space-y-6 overflow-y-auto py-0 xl:block'>
        <RightTrending items={trending} communities={communities} />
        {/* <RightTopTags /> */}
      </aside>
    </div>
  );
};

export default Home;
