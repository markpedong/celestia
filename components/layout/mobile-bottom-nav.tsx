'use client';

import { cn } from '@/lib/utils';
import { Compass, House, PlusCircle, Radio, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useGetProfile } from '@/hooks/useQueries';

const MobileBottomNav = () => {
  const user = useGetProfile().data?.data;
  const isSignedIn = Boolean(user?.id);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort');
  const items = [
    { href: '/', label: 'Home', icon: House, active: pathname === '/' && !sort },
    { href: '/?sort=hot', label: 'Explore', icon: Compass, active: pathname === '/' && sort === 'hot' },
    { href: '/?sort=new', label: 'Latest', icon: Radio, active: pathname === '/' && sort === 'new' },
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
      className='fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden'
    >
      <div className={cn('mx-auto grid max-w-lg', isSignedIn ? 'grid-cols-5' : 'grid-cols-3')}>
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('size-5', active && 'drop-shadow-[0_0_6px_var(--primary)]')} />
            <span className='truncate'>{label}</span>
            {active ? <span className='absolute bottom-0 h-0.5 w-5 rounded-full bg-primary' /> : null}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
