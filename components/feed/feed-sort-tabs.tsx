import type { FC } from 'react';
import type { FeedSort, FeedSortTabsProps, FeedTimeRange } from '@/lib/types';
import { Activity, BarChart2, Clock, Flame, TrendingUp, type LucideIcon } from 'lucide-react';
import classNames from 'classnames';
import Link from 'next/link';
import styles from './feed-sort-tabs.module.scss';

const rootPathFor = (sort: FeedSort, hotPath: string) => {
  if (sort === 'new') return '/posts';
  if (sort === 'top') return '/top';
  if (sort === 'rising') return '/rising';
  if (sort === 'controversial') return '/controversial';
  return hotPath;
};

const hrefFor = (sort: FeedSort, tag?: string, query?: string, basePath = '/', hotPath = '/explore', timeRange?: FeedTimeRange) => {
  const params = new URLSearchParams();
  const path = basePath === '/' ? rootPathFor(sort, hotPath) : basePath;
  if (basePath !== '/' && sort !== 'hot') params.set('sort', sort);
  if (tag && basePath === '/') params.set('tag', tag);
  if (query) params.set('q', query);
  if (timeRange && timeRange !== 'all' && (sort === 'top' || sort === 'controversial')) params.set('t', timeRange);
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

const FeedSortTabs: FC<FeedSortTabsProps> = ({ current, tag, query, basePath = '/', hotPath, timeRange }) => {
  const activeSort = current ?? 'hot';
  const tabs: { id: FeedSort; label: string; icon: LucideIcon }[] = [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Clock },
    { id: 'top', label: 'Top', icon: BarChart2 },
    { id: 'rising', label: 'Rising', icon: TrendingUp },
    { id: 'controversial', label: 'Controversial', icon: Activity },
  ];

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>{query ? 'Search results' : tag ? 'Filtered Posts' : 'Community Feed'}</h1>
      <div className={styles.list}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeSort === id;

          return (
            <Link
              key={id}
              href={hrefFor(id, tag, query, basePath, hotPath, timeRange)}
              className={classNames(styles.tab, {
                [styles.activeTab]: active,
              })}
            >
              <Icon className={classNames(styles.icon, {
                [styles.activeIcon]: active,
              })} />
              {label}
              {active ? <span className={styles.indicator} /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default FeedSortTabs;
