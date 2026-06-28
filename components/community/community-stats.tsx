'use client';

import { usePathname } from 'next/navigation';
import { StatGrid } from '../ui/stat-grid';
import { useGetCommunityStats } from '@/hooks/useQueries';
import { formatCount } from '@/lib/utils';
import classNames from 'classnames';
import type { FC } from 'react';
import styles from './community-stats.module.scss';

const CommunityStats: FC<{ className?: string }> = ({ className }) => {
  const slug = usePathname().split('/').pop() ?? '';
  const stats = useGetCommunityStats(slug).data?.data;

  return (
    <StatGrid
      className={classNames(styles.stats, className)}
      stats={[
        { label: 'Posts', value: formatCount(stats?.postCount) },
        { label: 'Members', value: formatCount(stats?.memberCount) },
        { label: 'Comments', value: formatCount(stats?.commentCount) },
      ]}
    />
  );
};

export default CommunityStats;
