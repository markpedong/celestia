'use client';

import { cn } from '@/lib/utils';
import { BarChart2, Compass, Hash, Home, Radio } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FC } from 'react';
import LeftTags from './left-tags';
import JoinCtaCard from './join-cta';
import { Tag } from '@/lib/types';
import packageJson from '@/package.json';

const nav = [
  { href: '/', label: 'Home', icon: Home, match: 'home' as const },
  { href: '/?sort=hot', label: 'Explore', icon: Compass, match: 'hot' as const },
  { href: '/?sort=new', label: 'Posts', icon: Radio, match: 'new' as const },
  { href: '/?sort=top', label: 'Top', icon: BarChart2, match: 'top' as const },
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
            pathname === '/' &&
            (item.match === 'home' ? !['hot', 'new', 'top'].includes(sort || '') : sort === item.match);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground celestia-hover-surface',
                active && 'bg-primary/12 text-primary ring-1 ring-primary/20'
              )}
            >
              <item.icon className={cn('size-4 shrink-0', active ? 'text-primary drop-shadow-[0_0_5px_var(--primary)]' : 'text-muted-foreground')} />
              {item.label}
              {active ? <span className='ml-auto h-3.5 w-1 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/40' /> : null}
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
        Celestia v{packageJson.version} · Community Forum
      </p>
    </aside>
  );
};

export default LeftSidebar;
