'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '../ui/avatar';

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

  return (
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <span className='size-1.5 rounded-full bg-success shadow-[0_0_6px] shadow-success/40' />
        Active Now
      </h3>
      <div className='flex items-center'>
        {Array.from({ length: 5 }, (_, index) => {
          return (
            <Avatar>
              <AvatarFallback
                key={index}
                className={`grid size-8 place-items-center rounded-full border-2 border-card text-xs font-semibold ${'bg-secondary/60 text-transparent'}`}
                style={{ marginLeft: index ? -8 : 0, zIndex: 10 - index }}
              >
                ✦
              </AvatarFallback>
            </Avatar>
          );
        })}
        <span className='ml-3 text-xs text-muted-foreground'>+{activeSessions} online</span>
      </div>

      {/* <p className='text-sm text-muted-foreground'>+{activeSessions} online</p> */}
    </section>
  );
};
