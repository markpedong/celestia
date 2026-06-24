'use client';

import { type FC } from 'react';
import { Plus, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import SearchBox from './search-box';
import type { NavbarProps } from '@/lib/types';
import { useGetProfile } from '@/hooks/useQueries';

const AccountMenu = dynamic(() => import('@/components/auth/account-menu'));

const Navbar: FC<NavbarProps> = ({ trending, communities }) => {
  const user = useGetProfile().data?.data;

  return (
    <header className='celestia-nav-shadow sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur-xl'>
      <div className='mx-auto flex h-14 w-full max-w-400 items-center gap-3 px-4'>
        <Link href='/' className='group flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground'>
          <span className='celestia-brand-mark size-8'>
            <Zap className='size-4 fill-current' aria-hidden />
          </span>
          <span className='hidden text-lg font-bold tracking-wide sm:inline'>Celestia</span>
        </Link>

        <SearchBox trending={trending} communities={communities} />

        {user ? (
          <div className='ml-auto flex shrink-0 items-center gap-2'>
            <Link
              href='/submit'
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'celestia-primary-action hidden sm:inline-flex'
              )}
            >
              <Plus />
              New Post
            </Link>
            <AccountMenu />
          </div>
        ) : null}

        {!user ? (
          <div className='ml-auto flex items-center gap-2'>
            <Link href={'/auth/sign-in'} className={cn(buttonVariants({ variant: 'ghost', size: 'default' }))}>
              Sign in
            </Link>
            <Link
              href={'/auth/sign-up'}
              className={cn(buttonVariants({ variant: 'default' }), 'celestia-primary-action')}
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
