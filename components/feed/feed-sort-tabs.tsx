import type { FC } from 'react';
import type { FeedSort, FeedSortTabsProps } from '@/lib/types';
import { BarChart2, Clock, Flame, type LucideIcon } from 'lucide-react';
import classNames from 'classnames';
import Link from 'next/link';
import styles from './feed-sort-tabs.module.scss';

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
    <div className={styles.root}>
      <h1 className={styles.heading}>{query ? 'Search results' : tag ? 'Filtered Posts' : 'Community Feed'}</h1>
      <div className={styles.list}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeSort === id;

          return (
            <Link
              key={id}
              href={hrefFor(id, tag, query, basePath, hotPath)}
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
