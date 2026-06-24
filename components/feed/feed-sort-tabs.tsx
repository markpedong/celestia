import type { FC } from 'react';
import type { FeedSort, FeedSortTabsProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BarChart2, Clock, Flame, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

const rootPathFor = (sort: FeedSort, hotPath: string) => {
  if (sort === 'new') return '/posts';
  if (sort === 'top') return '/top';
  return hotPath;
};

const hrefFor = (sort: FeedSort, tag?: string, query?: string, basePath = '/', hotPath = '/explore') => {
  const params = new URLSearchParams();
  const path = basePath === '/' ? rootPathFor(sort, hotPath) : basePath;
  if (basePath !== '/' && sort !== 'hot') params.set('sort', sort);
  if (tag && basePath === '/') params.set('tag', tag);
  if (query) params.set('q', query);
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

const FeedSortTabs: FC<FeedSortTabsProps> = ({ current, tag, query, basePath = '/', hotPath }) => {
  const activeSort = current ?? 'hot';
  const tabs: { id: FeedSort; label: string; icon: LucideIcon }[] = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: BarChart2 },
  ];

  return (
    <div className='mb-4 border-b border-border/80'>
      <div>
        <h1 className='sr-only'>{query ? 'Search results' : tag ? 'Filtered Posts' : 'Community Feed'}</h1>
      </div>
      <div className='flex items-center'>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeSort === id;

          return (
            <Link
              key={id}
              href={hrefFor(id, tag, query, basePath, hotPath)}
              className={cn(
                'relative inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('size-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
              {label}
              {active ? <span className='absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/40' /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FeedSortTabs;
