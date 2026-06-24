'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useGetProfile } from '@/hooks/useQueries';
import { UserAvatar } from '../ui/user-avatar';
import type { User } from '@/lib/types';

const supabase = createSupabaseBrowserClient();

export const ActiveNow = () => {
  const profile = useGetProfile().data?.data;
  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!profile) return;

    const channel = supabase.channel('celestia:online', {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const users = Object.values(channel.presenceState<{ user: User }>())
          .flat()
          .map(({ user }) => user)
          .filter((user): user is User => Boolean(user));
        setActiveUsers([...new Map(users.map(user => [user.id, user])).values()].slice(0, 5));
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void channel.track({ user: profile });
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [profile]);

  return (
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <span className='size-1.5 rounded-full bg-success shadow-[0_0_6px] shadow-success/40' />
        Active Now
      </h3>
      <div className='flex items-center'>
        <div className='flex items-center'>
          {activeUsers.map((user, index) => (
            <div
              key={user.id}
              style={{ marginLeft: index ? -8 : 0, zIndex: 10 - index }}
            >
              <UserAvatar user={user} className='border-2 border-card bg-secondary shadow-sm' />
            </div>
          ))}
        </div>

        <span className='ml-3 text-xs text-muted-foreground'>
          {activeUsers.length > 0 ? `+${activeUsers.length} online` : 'No one online'}
        </span>
      </div>
    </section>
  );
};
