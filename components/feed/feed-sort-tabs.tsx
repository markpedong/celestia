import { FeedSort } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Flame, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';

type Props = {
  current: FeedSort;
  tag: string;
};

function hrefFor(sort: FeedSort, tag?: string) {
  const params = new URLSearchParams();
  if (sort !== 'hot') params.set('sort', sort);
  if (tag) params.set('tag', tag);
  const q = params.toString();
  return q ? `/?${q}` : '/';
}

const FeedSortTabs = ({ current, tag }: Props) => {
  const tabs: { id: FeedSort; label: string; icon: typeof Flame }[] = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Sparkles },
    { id: 'top', label: 'Top', icon: TrendingUp },
  ];

  return (
    <div className='mb-5 flex flex-wrap items-center justify-between gap-3'>
      <div>
        <h1 className='text-base font-semibold text-foreground'>{tag ? 'Filtered Signals' : 'Community Feed'}</h1>
        <p className='mt-1 text-xs text-muted-foreground'>{tag ? `Topic orbit: ${tag}` : 'Latest discussions across Celestia'}</p>
      </div>
      <div className='celestia-surface-control flex items-center p-0.5'>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = current === id;

          return (
            <Link
              key={id}
              href={hrefFor(id, tag)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                active ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <Icon className={cn('size-3.5', active ? 'text-primary' : 'text-muted-foreground')} />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FeedSortTabs;
