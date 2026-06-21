'use client';

import type { FC } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@/lib/types';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type OnlineUser = Pick<User, 'id' | 'username' | 'displayName'> & { isAnonymous?: boolean };

const OnlineUsersContext = createContext<OnlineUser[]>([]);
const supabase = createSupabaseBrowserClient();

export const OnlineUsersProvider: FC<{ children: ReactNode }> = ({ children }: { children: ReactNode }) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [user, setUser] = useState<OnlineUser | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setUser(null);

      const displayName =
        (typeof data.user.user_metadata.full_name === 'string' && data.user.user_metadata.full_name) ||
        (typeof data.user.user_metadata.name === 'string' && data.user.user_metadata.name) ||
        undefined;
      setUser({ id: data.user.id, username: data.user.email?.split('@')[0] || 'user', displayName });
    };

    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => void loadUser());
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const visitorID = crypto.randomUUID();
    const channel = supabase.channel('celestia:online', {
      config: { presence: { key: user?.id ?? visitorID } },
    });
    const sync = () => {
      const users = Object.values(channel.presenceState<OnlineUser>()).flat();
      setOnlineUsers([...new Map(users.map(onlineUser => [onlineUser.id, onlineUser])).values()]);
    };

    channel.on('presence', { event: 'sync' }, sync).subscribe(status => {
      // ponytail: Presence is the online source of truth; store last_seen only for historical status.
      if (status === 'SUBSCRIBED') {
        void channel.track(user ?? { id: visitorID, username: 'Anonymous', isAnonymous: true });
      }
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
            title={onlineUser ? (onlineUser.isAnonymous ? 'Anonymous visitor' : onlineUser.displayName ?? onlineUser.username) : undefined}
            aria-hidden={!onlineUser}
            className={`grid size-8 place-items-center rounded-full border-2 border-card text-xs font-semibold ${onlineUser ? (onlineUser.isAnonymous ? 'bg-[radial-gradient(circle_at_30%_25%,#fff_0_6%,transparent_7%),radial-gradient(circle_at_70%_65%,#f0abfc_0_10%,transparent_11%),linear-gradient(135deg,#312e81,#7e22ce)] text-white' : 'bg-primary/15 text-primary') : 'bg-secondary/60 text-transparent'}`}
            style={{ marginLeft: index ? -8 : 0, zIndex: 10 - index }}
          >
            {onlineUser ? (onlineUser.isAnonymous ? '✦' : (onlineUser.displayName ?? onlineUser.username).slice(0, 1).toUpperCase()) : '·'}
          </span>
          );
        })}
        <span className='ml-3 text-xs text-muted-foreground'>+{onlineUsers.length} online</span>
      </div>
    </section>
  );
};
