'use client';

import type { FC } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type OnlineUser = Pick<User, 'id' | 'username' | 'displayName'>;

const OnlineUsersContext = createContext<OnlineUser[]>([]);
const supabase = createSupabaseBrowserClient();

export const OnlineUsersProvider: FC<{ user: User | null; children: ReactNode }> = ({ user, children }: { user: User | null; children: ReactNode }) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel('celestia:online', {
      config: { presence: { key: user?.id ?? 'observer' } },
    });
    const sync = () => {
      const users = Object.values(channel.presenceState<OnlineUser>()).flat();
      setOnlineUsers([...new Map(users.map(onlineUser => [onlineUser.id, onlineUser])).values()]);
    };

    channel.on('presence', { event: 'sync' }, sync).subscribe(status => {
      // ponytail: live tabs only; store last_seen if historical status is needed.
      if (status === 'SUBSCRIBED' && user) void channel.track({ id: user.id, username: user.username, displayName: user.displayName });
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return <OnlineUsersContext value={onlineUsers}>{children}</OnlineUsersContext>;
};

export const ActiveNow: FC<Record<never, never>> = () => {
  const onlineUsers = useContext(OnlineUsersContext);
  const visibleUsers = onlineUsers.slice(0, 5);

  return (
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <span className='size-1.5 rounded-full bg-success shadow-[0_0_6px] shadow-success/40' />
        Active Now
      </h3>
      <div className='flex items-center'>
        {Array.from({ length: 5 }, (_, index) => {
          const onlineUser = visibleUsers[index];

          return (
          <span
            key={onlineUser?.id ?? index}
            title={onlineUser ? onlineUser.displayName ?? onlineUser.username : undefined}
            aria-hidden={!onlineUser}
            className={`grid size-8 place-items-center rounded-full border-2 border-card text-xs font-semibold ${onlineUser ? 'bg-primary/15 text-primary' : 'bg-secondary/60 text-transparent'}`}
            style={{ marginLeft: index ? -8 : 0, zIndex: 10 - index }}
          >
            {onlineUser ? (onlineUser.displayName ?? onlineUser.username).slice(0, 1).toUpperCase() : '·'}
          </span>
          );
        })}
        <span className='ml-3 text-xs text-muted-foreground'>+{onlineUsers.length} online</span>
      </div>
    </section>
  );
};
