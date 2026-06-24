import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import { PostList } from '@/components/feed/post-list';
import { RightTrending } from '@/components/layout/right-trending';
import { EmptyState } from '@/components/ui/empty-state';
import { batchAuthorsForIds, batchUserStatsForIds, listPostSorted, listCommunity, tagsPostCounts } from '@/lib/db/queries';
import { trendingToday } from '@/lib/trending';
import type { FeedSort, SearchParams } from '@/lib/types';
import { FileQuestion } from 'lucide-react';

type HomeFeedProps = {
  searchParams: Promise<SearchParams>;
  sort: FeedSort;
  hotPath?: '/' | '/explore';
};

const HomeFeed = async ({ searchParams, sort, hotPath }: HomeFeedProps) => {
  const query = await searchParams;
  const tagFilter = (Array.isArray(query.tag) ? query.tag[0] : query.tag)?.toLowerCase() ?? '';
  const cleanedSearchQuery = ((Array.isArray(query.q) ? query.q[0] : query.q) ?? '').trim();

  const [rows, tags, tagCounts] = await Promise.all([
    listPostSorted(sort, tagFilter, undefined, cleanedSearchQuery),
    listCommunity(),
    tagsPostCounts(),
  ]);

  const authorIds = [...new Set(rows.map(({ post }) => post.authorId))];
  const [authorById, authorStatsById] = await Promise.all([
    batchAuthorsForIds(authorIds),
    batchUserStatsForIds(authorIds),
  ]);

  const tagsMap = new Map(tags.map(tag => [tag.slug, tag]));
  const communities = tagCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));
  const hasSearch = Boolean(cleanedSearchQuery);

  return (
    <div className='flex w-full min-w-0 gap-6'>
      <main className='w-full min-w-0 flex-1'>
        <FeedSortTabs current={sort} tag={tagFilter} query={cleanedSearchQuery} hotPath={hotPath} />

        {hasSearch && (
          <div className='mb-4 rounded border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
            Showing results for <span className='font-semibold text-foreground'>&quot;{cleanedSearchQuery}&quot;</span>
          </div>
        )}

        <div className='w-full space-y-3'>
          <PostList rows={rows} authorsById={authorById} authorStatsById={authorStatsById} tagsBySlug={tagsMap} isSignedIn={false} />

          {rows.length === 0 && (
            <EmptyState
              icon={FileQuestion}
              title={hasSearch ? 'No matching posts found' : 'No posts here yet'}
              description={hasSearch ? 'Try a different keyword or clear the search.' : 'Be the first to start a discussion.'}
              className='flex min-h-80 w-full flex-col items-center justify-center py-20'
            />
          )}
        </div>
      </main>

      <aside className='sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 space-y-6 overflow-y-auto xl:block'>
        <RightTrending items={trendingToday} communities={communities} />
      </aside>
    </div>
  );
};

export default HomeFeed;
