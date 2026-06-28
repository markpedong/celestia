'use client';

import type { FC } from 'react';
import { BarChart2, Compass, Hash, Home, Radio } from 'lucide-react';
import classNames from 'classnames';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LeftTags from './left-tags';
import JoinCtaCard from './join-cta';
import { Tag } from '@/lib/types';
import packageJson from '@/package.json';
import { useSession } from '@/hooks/useSession';
import styles from './left-sidebar.module.scss';

const nav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/posts', label: 'Posts', icon: Radio },
  { href: '/top', label: 'Top', icon: BarChart2 },
  { href: '/communities/new', label: 'Start a community', icon: Hash },
];

const LeftSidebar: FC<{
  tags: {
    tag: Tag;
    count: number;
  }[];
  communityLabel: string;
}> = ({ tags, communityLabel }: {
  tags: {
    tag: Tag;
    count: number;
  }[];
  communityLabel: string;
}) => {
  const pathname = usePathname();
  const { session } = useSession();

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {nav.map(item => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames('group celestia-hover-surface', styles.link, {
                [styles.activeLink]: active,
              })}
            >
              <item.icon
                className={classNames(styles.icon, {
                  [styles.activeIcon]: active,
                })}
              />
              {item.label}
              {active ? (
                <span className={styles.indicator} />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className={styles.tags}>
        <p className={styles.tagsLabel}>
          <Hash className={styles.tagsIcon} />
          {communityLabel}
        </p>
        <LeftTags
          tags={tags}
          emptyMessage={communityLabel === 'Joined Communities' ? 'Join communities to add them here.' : undefined}
        />
      </div>
      {session === null && (
        <div className={styles.cta}>
          <JoinCtaCard />
        </div>
      )}
      <p className={styles.version}>
        Celestia v{packageJson.version} · Community Forum
      </p>
    </aside>
  );
};

export default LeftSidebar;
