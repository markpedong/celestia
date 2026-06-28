'use client';

import classNames from 'classnames';
import { Compass, House, PlusCircle, Radio, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import styles from './mobile-bottom-nav.module.scss';

const MobileBottomNav = () => {
  const { user } = useSession();
  const isSignedIn = !!user;
  const pathname = usePathname();
  const items = [
    { href: '/', label: 'Home', icon: House, active: pathname === '/' },
    { href: '/explore', label: 'Explore', icon: Compass, active: pathname === '/explore' },
    { href: '/posts', label: 'Latest', icon: Radio, active: pathname === '/posts' },
    ...(isSignedIn
      ? [
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
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={classNames(styles.item, {
              [styles.activeItem]: active,
            })}
          >
            <Icon className={classNames(styles.icon, {
              [styles.activeIcon]: active,
            })} />
            <span className={styles.label}>{label}</span>
            {active ? <span className={styles.indicator} /> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
