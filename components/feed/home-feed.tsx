import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import { PostList } from '@/components/feed/post-list';
import { RightTrending } from '@/components/layout/right-trending';
import { EmptyState } from '@/components/ui/empty-state';
import { trendingToday } from '@/lib/trending';
import type { FeedSort, SearchParams } from '@/lib/types';
import { listCommunity, tagsPostCounts } from '@/lib/db/community.queries';
import { listPostSorted } from '@/lib/db/post.queries';
import { batchUserStatsForIDs, getAuthorByID } from '@/lib/db/user.queries';
import { FileQuestion, Radio } from 'lucide-react';
import uniq from 'lodash/uniq';

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

  const authorIDs = uniq(rows.map(({ post }) => post.authorID));
  const [authors, authorStatsByID] = await Promise.all([
    Promise.all(authorIDs.map(getAuthorByID)),
    batchUserStatsForIDs(authorIDs),
  ]);
  const authorByID = new Map(authors.flatMap(author => author ? [[author.id, author] as const] : []));

  const tagsMap = new Map(tags.map(tag => [tag.slug, tag]));
  const communities = tagCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ tag, count }) => ({ ...tag, postCount: count }));
  const hasSearch = Boolean(cleanedSearchQuery);

  return (
    <div className='flex w-full min-w-0 gap-6'>
      <main className='w-full min-w-0 flex-1'>
        <section className='celestia-card mb-4 overflow-hidden p-4 md:p-5'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div>
              <p className='celestia-panel-label mb-1'>
                <Radio className='size-3' /> Home signal
              </p>
              <h1 className='text-xl font-black tracking-tight md:text-2xl'>
                {tagFilter ? `r/${tagFilter}` : hasSearch ? 'Search results' : 'All communities'}
              </h1>
            </div>
          </div>
          <div className='mt-4'>
            <FeedSortTabs current={sort} tag={tagFilter} query={cleanedSearchQuery} hotPath={hotPath} />
          </div>
        </section>

        {hasSearch && (
          <div className='mb-4 rounded border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
            Showing results for <span className='font-semibold text-foreground'>&quot;{cleanedSearchQuery}&quot;</span>
          </div>
        )}

        <div className='w-full space-y-3'>
          <PostList rows={rows} authorsByID={authorByID} authorStatsByID={authorStatsByID} tagsBySlug={tagsMap} isSignedIn={false} />

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
