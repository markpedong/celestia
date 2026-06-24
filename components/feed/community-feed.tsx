'use client';

import { useCommunityFeed } from '@/hooks/useQueries';
import { FeedSort } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BarChart2, Clock, Flame, Hash, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { PostList } from './post-list';
import { EmptyState } from '../ui/empty-state';
import { usePathname } from 'next/navigation';

const sortTabs = [
  { id: 'hot' as const, label: 'Hot', icon: Flame },
  { id: 'new' as const, label: 'New', icon: Clock },
  { id: 'top' as const, label: 'Top', icon: BarChart2 },
];

const CommunityFeedLoader = () => (
  <div className='space-y-3' aria-label='Loading posts' role='status'>
    {[0, 1, 2].map(index => (
      <div key={index} className='celestia-card animate-pulse p-4'>
        <div className='h-3 w-28 rounded bg-muted' />
        <div className='mt-3 h-4 w-2/3 rounded bg-muted' />
        <div className='mt-2 h-3 w-full rounded bg-muted' />
      </div>
    ))}
  </div>
);

const CommunityFeed = () => {
  const slug = usePathname().split('/').pop();
  const [sort, setSort] = useState<FeedSort>('hot');
  const { data, error, isFetching, isLoading, refetch } = useCommunityFeed(slug, sort);
  const authorsByID = new Map(data?.authors.map(author => [author.id, author]));
  const authorStatsByID = new Map(data?.authorStats);
  const tagsBySlug = new Map(data?.tags.map(tag => [tag.slug, tag]));
  const feed = data?.rows ?? [];

  return (
    <section>
      <div className='mb-4 border-b border-border/80'>
        <div className='flex items-center'>
          {sortTabs.map(({ id, label, icon: Icon }) => {
            const active = sort === id;
            return (
              <button
                key={id}
                type='button'
                onClick={() => setSort(id)}
                aria-pressed={active}
                className={cn(
                  'relative inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('size-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
                {label}
                {active ? (
                  <span className='absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/40' />
                ) : null}
              </button>
            );
          })}
          {isFetching ? (
            <LoaderCircle className='ml-auto size-4 animate-spin text-muted-foreground' aria-label='Updating posts' />
          ) : null}
        </div>
      </div>
      {isLoading ? <CommunityFeedLoader /> : null}
      {!isLoading && error ? (
        <div className='celestia-card flex flex-col items-center gap-3 p-8 text-center'>
          <p className='text-sm text-muted-foreground'>Unable to load posts right now.</p>
          <button
            type='button'
            onClick={() => void refetch()}
            className='text-sm font-semibold text-primary hover:text-primary-hover'
          >
            Try again
          </button>
        </div>
      ) : null}
      {!isLoading && !error ? (
        <div className='space-y-3'>
          <PostList
            rows={feed}
            authorsByID={authorsByID}
            authorStatsByID={authorStatsByID}
            tagsBySlug={tagsBySlug}
            isSignedIn={true}
          />
          {feed.length === 0 ? (
            <EmptyState
              icon={Hash}
              title={`No posts in r/${slug} yet`}
              description='Start the first thread for this community.'
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default CommunityFeed;
