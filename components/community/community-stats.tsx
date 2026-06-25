'use client';

import { usePathname } from 'next/navigation';
import { StatGrid } from '../ui/stat-grid';
import { useGetCommunityStats } from '@/hooks/useQueries';
import { cn, formatCount } from '@/lib/utils';
import type { FC } from 'react';

const CommunityStats: FC<{ className?: string }> = ({ className }) => {
  const slug = usePathname().split('/').pop() ?? '';
  const stats = useGetCommunityStats(slug).data?.data;

  return (
    <StatGrid
      className={cn('max-w-lg md:max-w-none', className)}
      stats={[
        { label: 'Posts', value: formatCount(stats?.postCount) },
        { label: 'Members', value: formatCount(stats?.memberCount) },
        { label: 'Comments', value: formatCount(stats?.commentCount) },
      ]}
    />
  );
};

export default CommunityStats;
