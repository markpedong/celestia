'use client';

import { cn } from '@/lib/utils';
import { Flame, Globe, Hash, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FC } from 'react';
import LeftTags from './left-tags';
import JoinCtaCard from './join-cta';
import { Tag } from '@/lib/types';

const nav = [
  { href: '/', label: 'Home', icon: Home, match: 'home' as const },
  { href: '/?sort=hot', label: 'Popular', icon: Flame, match: 'hot' as const },
  { href: '/?sort=new', label: 'All Posts', icon: Globe, match: 'new' as const },
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
    <aside className='sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border/70 lg:block'>
      <nav className='space-y-1 p-4'>
        {nav.map(item => {
          const active =
            pathname === '/' &&
            (item.match === 'home' ? !['hot', 'new', 'top'].includes(sort || '') : sort === item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
                active && 'bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_rgba(124,106,247,0.08)]'
              )}
            >
              <item.icon className={cn('size-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className='mt-4 px-4'>
        <p className='mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
          <Hash className='size-3' />
          Topics
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
