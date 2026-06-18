'use client';

import { cn } from '@/lib/utils';
import { Bookmark, Compass, Hash, Home, Radio, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FC } from 'react';
import LeftTags from './left-tags';
import JoinCtaCard from './join-cta';
import { Tag } from '@/lib/types';

const nav = [
  { href: '/', label: 'Home', icon: Home, match: 'home' as const },
  { href: '/?sort=hot', label: 'Explore', icon: Compass, match: 'hot' as const },
  { href: '/?sort=new', label: 'Signals', icon: Radio, match: 'new' as const },
  { href: '/?sort=top', label: 'Bookmarks', icon: Bookmark, match: 'top' as const },
  { href: '/auth/sign-in', label: 'Profile', icon: UserRound, match: 'profile' as const },
];

const LeftSidebar: FC<{
  showCta: boolean;
  tags: {
    tag: Tag;
    count: number;
  }[];
}> = ({ showCta, tags }) => {
  const pathname = usePathname();
  const params = useSearchParams();
  const sort = params.get('sort');

  return (
    <aside className='sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border/80 bg-sidebar/50 lg:block'>
      <nav className='space-y-1 p-4'>
        {nav.map(item => {
          const active =
            item.match !== 'profile' &&
            pathname === '/' &&
            (item.match === 'home' ? !['hot', 'new', 'top'].includes(sort || '') : sort === item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                active && 'bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgba(139,92,246,0.22)]'
              )}
            >
              <item.icon className={cn('size-4 shrink-0', active ? 'text-primary drop-shadow-[0_0_5px_rgba(139,92,246,0.75)]' : 'text-muted-foreground')} />
              {item.label}
              {active ? <span className='ml-auto h-3.5 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.85)]' /> : null}
            </Link>
          );
        })}
      </nav>
      <div className='mt-4 px-4'>
        <p className='mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
          <Hash className='size-3' />
          Communities
        </p>
        <LeftTags tags={tags} />
      </div>
      {showCta && (
        <div className='mt-8 px-4'>
          <JoinCtaCard />
        </div>
      )}
      <p className='mt-auto px-7 pb-4 pt-8 font-mono text-[10px] leading-relaxed text-muted-foreground/50'>
        Celestia v0.9 · Community Discussion
      </p>
    </aside>
  );
};

export default LeftSidebar;
