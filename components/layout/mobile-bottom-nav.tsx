'use client';

import classNames from 'classnames';
import { Compass, House, Inbox, PlusCircle, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { OPEN_CHAT_EVENT } from '@/lib/chat-events';
import styles from './mobile-bottom-nav.module.scss';

const MobileBottomNav = () => {
  const { user } = useSession();
  const isSignedIn = !!user;
  const pathname = usePathname();
  const items = [
    { href: '/', label: 'Home', icon: House, active: pathname === '/' },
    { href: '/explore', label: 'Explore', icon: Compass, active: pathname === '/explore' },
    ...(isSignedIn
      ? [
          { action: 'inbox', label: 'Inbox', icon: Inbox, active: false },
          {
            href: '/submit',
            label: 'Create',
            icon: PlusCircle,
            active: pathname === '/submit',
          },
          {
            href: '/profile',
            label: 'Profile',
            icon: UserRound,
            active: pathname === '/profile' || pathname.startsWith('/u/'),
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label='Mobile navigation'
      className={styles.nav}
    >
      <div className={classNames(styles.grid, {
        [styles.signedIn]: isSignedIn,
        [styles.signedOut]: !isSignedIn,
      })}>
        {items.map(item => {
          const Icon = item.icon;
          const itemClassName = classNames(styles.item, {
            [styles.activeItem]: item.active,
          });
          const icon = (
            <Icon className={classNames(styles.icon, {
              [styles.activeIcon]: item.active,
            })} />
          );

          if ('action' in item) {
            return (
              <button
                key={item.label}
                type='button'
                className={itemClassName}
                onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))}
              >
                {icon}
                <span className={styles.label}>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={itemClassName}
            >
              {icon}
              <span className={styles.label}>{item.label}</span>
              {item.active ? <span className={styles.indicator} /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
