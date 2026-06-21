'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { FALLBACK_NAMES, MAX_VISIBLE } from '@/lib/constants';

const supabase = createSupabaseBrowserClient();

export const ActiveNow = () => {
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    const channel = supabase.channel('celestia:online', {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setActiveSessions(Object.keys(channel.presenceState()).length);
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') void channel.track({});
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const visibleUsers = useMemo(() => {
    const count = Math.min(activeSessions, MAX_VISIBLE);

    return Array.from({ length: count }, (_, index) => {
      const name = FALLBACK_NAMES[index % FALLBACK_NAMES.length];

      return {
        name,
        image: `https://api.dicebear.com/9.x/thumbs/svg?seed=celestia-${index}`,
      };
    });
  }, [activeSessions]);

  return (
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <span className='size-1.5 rounded-full bg-success shadow-[0_0_6px] shadow-success/40' />
        Active Now
      </h3>
      <div className='flex items-center'>
        <div className='flex items-center'>
          {visibleUsers.map((user, index) => (
            <Avatar
              key={`${user.name}-${index}`}
              className='size-8 border-2 border-card bg-secondary shadow-sm'
              style={{ marginLeft: index ? -8 : 0, zIndex: 10 - index }}
            >
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className='bg-secondary text-[10px] font-semibold text-secondary-foreground'>
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>

        <span className='ml-3 text-xs text-muted-foreground'>
          {activeSessions > 0 ? `+${activeSessions} online` : 'No one online'}
        </span>
      </div>
    </section>
  );
};
