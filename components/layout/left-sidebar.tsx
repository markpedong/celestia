'use client';

import { cn } from '@/lib/utils';
import { Flame, Home, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FC } from 'react';
import LeftTags from './left-tags';
import JoinCtaCard from './join-cta';

const nav = [
  { href: '/', label: 'Home', icon: Home, match: 'home' as const },
  { href: '/?sort=hot', label: 'Popular', icon: Flame, match: 'hot' as const },
  {
    href: '/?sort=new',
    label: 'All Posts',
    icon: LayoutGrid,
    match: 'new' as const,
  },
];

const LeftSidebar: FC<{ showCta: boolean }> = ({ showCta }) => {
  const pathname = usePathname();
  const params = useSearchParams();
  const sort = params.get('sort');

  return (
    <aside className='hidden w-52 shrink-0 lg:block'>
      <nav className='space-y-1 pr-2'>
        {nav.map(item => {
          const active =
            pathname === '/' &&
            (item.match === 'home' ? !['hot', 'new', 'top'].includes(sort || '') : sort === item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                active && 'border-primary bg-muted/60 text-foreground'
              )}
            >
              <item.icon className={cn('size-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className='mt-8'>
        <p className='mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Top Tags</p>
        <LeftTags />
      </div>
      {showCta && (
        <div className='mt-8'>
          <JoinCtaCard />
        </div>
      )}
    </aside>
  );
};

export default LeftSidebar;
