'use client';

import { usePathname } from 'next/navigation';
import { StatGrid } from '../ui/stat-grid';
import { useGetCommunityStats } from '@/hooks/useQueries';
import { formatCount } from '@/lib/utils';

const CommunityStats = () => {
  const slug = usePathname().split('/').pop() ?? '';
  const stats = useGetCommunityStats(slug).data?.data;

  return (
    <StatGrid
      className='mt-4 max-w-lg'
      stats={[
        { label: 'Posts', value: formatCount(stats?.postCount) },
        { label: 'Members', value: formatCount(stats?.memberCount) },
        { label: 'Comments', value: formatCount(stats?.commentCount) },
      ]}
    />
  );
};

export default CommunityStats;
