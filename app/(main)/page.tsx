import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import PostCard from '@/components/feed/post-card';
import { RightTrending } from '@/components/layout/right-trending';
import { getSessionUser } from '@/lib/auth';
import { batchAuthorsForIds, listPostSorted, listTags, tagsPostCounts } from '@/lib/db/queries';
import { getTrendingToday } from '@/lib/trending';
import { FeedSort } from '@/lib/types';
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

  const cards = rows.map(row => {
    const author = authorById.get(row.post.authorId);
    if (!author) return null;

    return (
      <PostCard
        key={row.post.id}
        post={row.post}
        author={author}
        tagsBySlug={tagsMap}
        score={row.score}
        userVote={row.userVote}
      />
    );
  });

  return (
    <div className='flex gap-6'>
      <div className='min-w-0 flex-1'>
        <FeedSortTabs current={sort} tag={tagFilter} query={cleanedSearchQuery} />
        {cleanedSearchQuery ? (
          <div className='mb-4 rounded-xl border border-border/80 bg-secondary/45 px-4 py-3 text-sm text-muted-foreground'>
            Showing results for <span className='font-semibold text-foreground'>&quot;{cleanedSearchQuery}&quot;</span>
          </div>
        ) : null}
        <div className='space-y-3'>
          {cards}
          {rows.length === 0 && (
            <div className='celestia-card flex flex-col items-center justify-center px-6 py-20 text-center'>
              <div className='mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-[0_0_24px] shadow-primary/15'>
                <span className='font-mono text-lg'>0</span>
              </div>
              <h2 className='text-base font-semibold text-muted-foreground'>
                {cleanedSearchQuery ? 'No matching posts found' : 'No posts here yet'}
              </h2>
              <p className='mt-2 max-w-72 text-sm leading-relaxed text-muted-foreground/70'>
                {cleanedSearchQuery ? 'Try a different keyword or clear the search.' : 'Be the first to start a discussion.'}
              </p>
            </div>
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
