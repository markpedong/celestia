'use client';

import { useGetCommunityStats } from '@/hooks/useQueries';
import { formatCount } from '@/lib/utils';
import { CakeSlice, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';

const CommunitySidebar = () => {
  const slug = usePathname().split('/').pop() ?? '';
  const { data: stats } = useGetCommunityStats(slug);

  return (
    <section className='celestia-card p-4'>
      <h2 className='mb-3 text-sm font-semibold'>About Community</h2>
      <p className='text-xs leading-6 text-muted-foreground'>
        r/{slug} is a real community with membership. Join it to add it to your communities and create posts there.
      </p>
      <div className='mt-4 space-y-2 text-xs text-muted-foreground'>
        <p className='flex items-center gap-2'>
          <Users className='size-3 text-primary' /> {formatCount(stats?.data?.memberCount)} members
        </p>
        <p className='flex items-center gap-2'>
          <CakeSlice className='size-3 text-primary' /> Community discussions
        </p>
      </div>
    </section>
  );
};

export default CommunitySidebar;
