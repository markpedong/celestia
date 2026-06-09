import FeedSortTabs from '@/components/feed/feed-sort-tabs';
import PostCard from '@/components/feed/post-card';
import { getSessionUser } from '@/lib/auth';
import { batchAuthorsForIds, listPostSorted, listTags } from '@/lib/db/queries';
import { FeedSort } from '@/lib/types';
import { FC } from 'react';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const Home: FC<Props> = async ({ searchParams }) => {
  const sessionUser = await getSessionUser();
  const query = await searchParams;

  const sort = (Array.isArray(query.sort) ? query.sort[0] : query.sort) as FeedSort;
  const tag = Array.isArray(query.tag) ? query.tag[0] : query.tag;
  const tagFilter = tag?.toLowerCase() ?? '';

  const rows = await listPostSorted(sort, tagFilter, sessionUser?.id);
  const tags = await listTags();
  const tagsMap = new Map(tags.map(t => [t.slug, t]));
  const authorIds = [...new Set(rows.map(row => row.post.authorId))];
  const authorById = await batchAuthorsForIds(authorIds);

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
    <div className='flex gap-8'>
      <div className='min-w-0 flex-1'>
        <FeedSortTabs current={sort} tag={tagFilter} />
        <div className='space-y-4'>
          {cards}
          {rows.length === 0 && (
            <p className='rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground'>
              No posts match this filter.
            </p>
          )}
        </div>
      </div>
      <aside className='hidden w-72 shrink-0 space-y-6 lg:block'>
        {/* <RightTrending items={trending} /> */}
        {/* <RightTopTags /> */}
      </aside>
    </div>
  );
};

export default Home;
