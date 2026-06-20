import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import { PostList } from '@/components/feed/post-list';
import { RightTrending } from '@/components/layout/right-trending';
import { EmptyState } from '@/components/ui/empty-state';
import { getSessionUser } from '@/lib/auth';
import { batchAuthorsForIds, listPostSorted, listTags, tagsPostCounts } from '@/lib/db/queries';
import { getTrendingToday } from '@/lib/trending';
import type { FeedSort, HomePageProps } from '@/lib/types';
import { FileQuestion } from 'lucide-react';
import { FC } from 'react';

const Home: FC<HomePageProps> = async ({ searchParams }) => {
  const [sessionUser, query] = await Promise.all([getSessionUser(), searchParams]);

  const rawSort = Array.isArray(query.sort) ? query.sort[0] : query.sort;
  const sort: FeedSort = rawSort === 'new' || rawSort === 'top' ? rawSort : 'hot';

  const tagFilter = (Array.isArray(query.tag) ? query.tag[0] : query.tag)?.toLowerCase() ?? '';
  const cleanedSearchQuery = ((Array.isArray(query.q) ? query.q[0] : query.q) ?? '').trim();

  const [rows, tags, tagCounts] = await Promise.all([
    listPostSorted(sort, tagFilter, sessionUser?.id, cleanedSearchQuery),
    listTags(),
    tagsPostCounts(),
  ]);

  const [authorById, trending] = await Promise.all([
    batchAuthorsForIds([...new Set(rows.map(({ post }) => post.authorId))]),
    getTrendingToday(),
  ]);

  const tagsMap = new Map(tags.map(tag => [tag.slug, tag]));

  const communities = tagCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));

  const hasSearch = Boolean(cleanedSearchQuery);
  const isEmpty = rows.length === 0;

  return (
    <div className='flex w-full min-w-0 gap-6'>
      <main className='w-full min-w-0 flex-1'>
        <FeedSortTabs current={sort} tag={tagFilter} query={cleanedSearchQuery} />

        {hasSearch && (
          <div className='mb-4 rounded border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
            Showing results for <span className='font-semibold text-foreground'>&quot;{cleanedSearchQuery}&quot;</span>
          </div>
        )}

        <div className='w-full space-y-3'>
          <PostList rows={rows} authorsById={authorById} tagsBySlug={tagsMap} />

          {isEmpty && (
            <EmptyState
              icon={FileQuestion}
              title={hasSearch ? 'No matching posts found' : 'No posts here yet'}
              description={
                hasSearch ? 'Try a different keyword or clear the search.' : 'Be the first to start a discussion.'
              }
              className='flex min-h-80 w-full flex-col items-center justify-center py-20'
            />
          )}
        </div>
      </main>

      <aside className='sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 space-y-6 overflow-y-auto xl:block'>
        <RightTrending items={trending} communities={communities} />
      </aside>
    </div>
  );
};

export default Home;
