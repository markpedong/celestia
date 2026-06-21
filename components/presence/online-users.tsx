'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export const ActiveNow = () => {
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    const channel = supabase.channel('celestia:online', {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      setActiveSessions(Object.keys(channel.presenceState()).length);
    }).subscribe(status => {
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
      <p className='text-sm text-muted-foreground'>+{activeSessions} online</p>
    </section>
  );
};
