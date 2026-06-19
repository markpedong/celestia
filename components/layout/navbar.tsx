import { Activity, Bell, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '../ui/button';
import { SignedIn, SignedOut } from '@neondatabase/auth/react';
import AccountMenu from '@/components/auth/account-menu';
import SearchBox from './search-box';
import type { TrendingItem } from '@/lib/trending';
import type { SearchTagSuggestion } from '@/lib/types';

type Props = {
  trending: TrendingItem[];
  communities: SearchTagSuggestion[];
};

const Navbar = ({ trending, communities }: Props) => {
  return (
    <header className='celestia-nav-shadow sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur-xl'>
      <div className='mx-auto flex h-14 max-w-320 items-center gap-3 px-4'>
        <Link href='/' className='group flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground'>
          <span className='celestia-brand-mark size-8'>
            <Zap className='size-4 fill-current' aria-hidden />
          </span>
          <span className='hidden text-lg font-bold tracking-wide sm:inline'>Celestia</span>
        </Link>

        <SearchBox trending={trending} communities={communities} />

        <SignedIn>
          <Link
            href='/submit'
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'celestia-primary-action hidden sm:inline-flex'
            )}
          >
            <Plus className='size-3.5' />
            New Post
          </Link>

          <Button variant='ghost' size='icon' className='hidden rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:bg-muted hover:text-accent sm:inline-flex' aria-label='Activity'>
            <Activity className='size-4' />
          </Button>
          <Button variant='ghost' size='icon' className='relative rounded-xl border border-border bg-secondary/60 text-muted-foreground hover:bg-muted hover:text-primary' aria-label='Notifications'>
            <Bell className='size-5' />
            <span className='absolute right-2 top-2 size-1.5 rounded-full bg-primary shadow-[0_0_6px] shadow-primary/40' />
          </Button>
          <AccountMenu />
        </SignedIn>

        <SignedOut>
          <div className='ml-auto flex items-center gap-2'>
            <Link href={'/auth/sign-in'} className={cn(buttonVariants({ variant: 'ghost', size: 'default' }))}>
              Sign in
            </Link>
            <Link
              href={'/auth/sign-up'}
              className={cn(
                buttonVariants({ variant: 'default' }),
                'celestia-primary-action'
              )}
            >
              Join
            </Link>
          </div>
        </SignedOut>
      </div>
    </header>
  );
};

export default Navbar;
