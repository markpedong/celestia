import { Bell, Plus, Search, Telescope } from 'lucide-react';
import Link from 'next/link';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '../ui/button';
import { SignedIn, SignedOut } from '@neondatabase/auth/react';
import AccountMenu from '@/components/auth/account-menu';

const Navbar = () => {
  return (
    <header className='sticky top-0 z-50 border-b border-border bg-background/90 shadow-[0_1px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl'>
      <div className='mx-auto flex h-14 max-w-320 items-center gap-3 px-4'>
        <Link href='/' className='group flex shrink-0 items-center gap-2 font-semibold tracking-tight text-foreground'>
          <span className='celestia-brand-mark size-8'>
            <Telescope className='size-4' aria-hidden />
          </span>
          <span className='hidden text-lg font-semibold sm:inline'>Celestia</span>
        </Link>

        <div className='relative mx-auto max-w-xl flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            readOnly
            placeholder='Search signals...'
            className='h-9 w-full rounded-lg border-border bg-secondary/80 pl-10 pr-4 text-sm shadow-inner focus-visible:border-primary/50 focus-visible:ring-primary/20'
            aria-label='Search posts'
          />
        </div>

        <SignedIn>
          <Link
            href='/submit'
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'celestia-primary-action hidden sm:inline-flex'
            )}
          >
            <Plus className='size-3.5' />
            New Signal
          </Link>

          <Button variant='ghost' size='icon' className='relative text-muted-foreground hover:bg-white/5' aria-label='Notifications'>
            <Bell className='size-5' />
            <span className='absolute right-2 top-2 size-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(124,106,247,0.8)]' />
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
