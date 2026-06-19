import { FeedSort } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BarChart2, Clock, Flame, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

type Props = {
  current: FeedSort;
  tag: string;
  query: string;
};

const hrefFor = (sort: FeedSort, tag?: string, query?: string) => {
  const params = new URLSearchParams();
  if (sort !== 'hot') params.set('sort', sort);
  if (tag) params.set('tag', tag);
  if (query) params.set('q', query);
  const q = params.toString();
  return q ? `/?${q}` : '/';
}

const FeedSortTabs = ({ current, tag, query }: Props) => {
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
              href={hrefFor(id, tag, query)}
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
