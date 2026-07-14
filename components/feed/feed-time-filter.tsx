import Link from 'next/link';
import type { FeedSort, FeedTimeRange } from '@/lib/types';
import { cn } from '@/lib/utils';

const ranges: { id: FeedTimeRange; label: string }[] = [
  { id: 'hour', label: 'Hour' },
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'all', label: 'All time' },
];

export const FeedTimeFilter = ({
  sort,
  current,
  tag,
  query,
}: {
  sort: Extract<FeedSort, 'top' | 'controversial'>;
  current: FeedTimeRange;
  tag?: string;
  query?: string;
}) => (
  <nav className='mt-3 flex flex-wrap gap-1' aria-label='Feed time range'>
    {ranges.map(range => {
      const params = new URLSearchParams();
      if (range.id !== 'all') params.set('t', range.id);
      if (tag) params.set('tag', tag);
      if (query) params.set('q', query);
      const href = `/${sort}${params.size ? `?${params}` : ''}`;
      return (
        <Link
          key={range.id}
          href={href}
          aria-current={current === range.id ? 'page' : undefined}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition',
            current === range.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {range.label}
        </Link>
      );
    })}
  </nav>
);
