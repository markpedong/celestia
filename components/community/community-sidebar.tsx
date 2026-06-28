'use client';

import { useGetCommunityStats } from '@/hooks/useQueries';
import { formatCount } from '@/lib/utils';
import type { Community } from '@/lib/types';
import { CakeSlice, Hash, MessageSquare, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { FC } from 'react';

const CommunitySidebar: FC<{ community?: Community }> = ({ community }) => {
  const slug = usePathname().split('/').pop() ?? '';
  const { data: stats } = useGetCommunityStats(slug);
  const color = community?.hashColor ?? 'var(--primary)';

  return (
    <section className='celestia-card overflow-hidden'>
      <div className='h-2' style={{ backgroundColor: color }} />
      <div className='p-4'>
        <div className='flex items-center gap-3'>
          <div
            className='grid size-10 place-items-center rounded text-sm font-black text-primary-foreground'
            style={{ backgroundColor: color }}
          >
            {(community?.label ?? slug).slice(0, 1).toUpperCase()}
          </div>
          <div className='min-w-0'>
            <h2 className='truncate text-sm font-semibold'>About r/{slug}</h2>
            <p className='text-xs text-muted-foreground'>Community overview</p>
          </div>
        </div>
        <p className='mt-4 text-xs leading-6 text-muted-foreground'>
          {community?.description ||
            `r/${slug} is a place for focused discussions, shared posts, and member-led conversations.`}
        </p>
        <div className='mt-4 grid gap-2 text-xs'>
          <div className='celestia-stat-row'>
            <span className='flex items-center gap-2 text-muted-foreground'>
              <Users className='size-3.5 text-primary' /> Members
            </span>
            <span className='font-mono font-semibold text-foreground'>{formatCount(stats?.data?.memberCount)}</span>
          </div>
          <div className='celestia-stat-row'>
            <span className='flex items-center gap-2 text-muted-foreground'>
              <MessageSquare className='size-3.5 text-primary' /> Comments
            </span>
            <span className='font-mono font-semibold text-foreground'>{formatCount(stats?.data?.commentCount)}</span>
          </div>
          <div className='celestia-stat-row'>
            <span className='flex items-center gap-2 text-muted-foreground'>
              <Hash className='size-3.5 text-primary' /> Posts
            </span>
            <span className='font-mono font-semibold text-foreground'>{formatCount(stats?.data?.postCount)}</span>
          </div>
        </div>
        <p className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
          <CakeSlice className='size-3.5 text-primary' />
          Join to keep this community in your orbit.
        </p>
      </div>
    </section>
  );
};

export default CommunitySidebar;
