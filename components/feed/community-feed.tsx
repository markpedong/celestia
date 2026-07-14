'use client';

import { useCommunityFeed } from '@/hooks/useQueries';
import { FeedSort } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Activity, BarChart2, Clock, Flame, Hash, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { PostList } from './post-list';
import { EmptyState } from '../ui/empty-state';
import { usePathname } from 'next/navigation';
import Skeleton from 'react-loading-skeleton';
import { useSession } from '@/hooks/useSession';

const sortTabs = [
  { id: 'hot' as const, label: 'Hot', icon: Flame },
  { id: 'new' as const, label: 'New', icon: Clock },
  { id: 'top' as const, label: 'Top', icon: BarChart2 },
  { id: 'rising' as const, label: 'Rising', icon: TrendingUp },
  { id: 'controversial' as const, label: 'Controversial', icon: Activity },
];

const CommunityFeedLoader = () => (
  <div className='space-y-3' aria-label='Loading posts' role='status'>
    {[0, 1, 2].map(index => (
      <article key={index} className='celestia-card flex w-full overflow-hidden'>
        <div className='celestia-vote-rail flex min-w-[50px] flex-col items-center justify-start border-r border-border/60 px-2.5 py-4'>
          <Skeleton circle width={22} height={22} />
          <Skeleton className='my-1' width={28} height={14} />
          <Skeleton circle width={22} height={22} />
        </div>
        <div className='min-w-0 flex-1 p-4 md:p-5'>
          <div className='mb-2 flex items-center gap-2'>
            <Skeleton circle width={20} height={20} />
            <Skeleton width={120} height={12} />
            <Skeleton width={72} height={12} />
            <Skeleton width={92} height={18} />
          </div>
          <Skeleton width='68%' height={20} />
          <Skeleton className='mt-2' width='92%' height={14} />
          <Skeleton width='74%' height={14} />
          {index !== 1 ? <Skeleton className='mt-4' height={220} /> : null}
          <div className='mt-4 flex items-center gap-2'>
            <Skeleton width={96} height={26} />
            <Skeleton width={68} height={26} />
          </div>
        </div>
      </article>
    ))}
  </div>
);

const CommunityFeed = () => {
  const slug = usePathname().split('/').pop();
  const [sort, setSort] = useState<FeedSort>('hot');
  const session = useSession().session;
  const { data, error, isFetching, isLoading, refetch } = useCommunityFeed(slug, sort);
  const authorsByID = new Map(data?.authors.map(author => [author.id, author]));
  const authorStatsByID = new Map(data?.authorStats);
  const tagsBySlug = new Map(data?.tags.map(tag => [tag.slug, tag]));
  const feed = data?.rows ?? [];

  return (
    <section>
      <div className='mb-4 flex items-center border-b border-border/80'>
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
        {isFetching && !isLoading ? (
          <span className='ml-auto text-xs font-medium text-muted-foreground' role='status' aria-live='polite'>
            Refreshing posts
          </span>
        ) : null}
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
            isSignedIn={Boolean(session)}
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
