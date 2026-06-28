'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useGetProfile } from '@/hooks/useQueries';
import { UserAvatar } from '../ui/user-avatar';
import type { User } from '@/lib/types';
import classNames from 'classnames';
import styles from './online-users.module.scss';

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
    <section className={classNames('celestia-card', styles.card)}>
      <h3 className={styles.heading}>
        <span className={styles.statusDot} />
        Active Now
      </h3>
      <div className={styles.row}>
        <div className={styles.avatars}>
          {activeUsers.map((user, index) => (
            <div
              key={user.id}
              style={{ marginLeft: index ? -8 : 0, zIndex: 10 - index }}
            >
              <UserAvatar user={user} className={styles.avatar} />
            </div>
          ))}
        </div>

        <span className={styles.label}>
          {activeUsers.length > 0 ? `+${activeUsers.length} online` : 'No one online'}
        </span>
      </div>
    </section>
  );
};
