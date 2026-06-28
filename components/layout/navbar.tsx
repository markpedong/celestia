'use client';

import { type FC } from 'react';
import { Menu, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import classNames from 'classnames';
import { buttonVariants } from '../ui/button';
import SearchBox from './search-box';
import type { NavbarProps } from '@/lib/types';
import { useGetProfile } from '@/hooks/useQueries';
import { AccountMenuDynamic } from '@/components/dynamic-import';
import { OPEN_LEFT_SIDEBAR_EVENT } from '@/lib/layout-events';
import styles from './navbar.module.scss';

const Navbar: FC<NavbarProps> = ({ trending, communities }) => {
  const user = useGetProfile().data?.data;

  return (
    <header className={classNames('celestia-nav-shadow', styles.header)}>
      <div className={styles.inner}>
        <button
          type='button'
          className={styles.menuButton}
          aria-label='Open sidebar'
          onClick={() => window.dispatchEvent(new Event(OPEN_LEFT_SIDEBAR_EVENT))}
        >
          <Menu aria-hidden />
        </button>

        <Link href='/' className={classNames('group', styles.brand)}>
          <span className={classNames('celestia-brand-mark', styles.mark)}>
            <Zap className={styles.brandIcon} aria-hidden />
          </span>
          <span className={styles.name}>Celestia</span>
        </Link>

        <SearchBox trending={trending} communities={communities} />

        {user ? (
          <div className={styles.actions}>
            <Link
              href='/submit'
              className={classNames(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'celestia-primary-action',
                styles.newPost
              )}
            >
              <Plus />
              New Post
            </Link>
            <AccountMenuDynamic />
          </div>
        ) : null}

        {!user ? (
          <div className={styles.guestActions}>
            <Link href={'/auth/sign-in'} className={classNames(buttonVariants({ variant: 'ghost', size: 'default' }))}>
              Sign in
            </Link>
            <Link
              href={'/auth/sign-up'}
              className={classNames(buttonVariants({ variant: 'default' }), 'celestia-primary-action')}
            >
              Join
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Navbar;
