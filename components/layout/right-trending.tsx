import Link from 'next/link';
import type { TrendingItem } from '@/lib/trending';
import type { SearchTagSuggestion } from '@/lib/types';
import { Flame, Minus, Sparkles, TrendingUp, Users } from 'lucide-react';

const MomentumIcon = ({ index }: { index: number }) => {
  if (index === 0) return <Flame className='size-3 text-amber-400' />;
  if (index === 1) return <TrendingUp className='size-3 text-success' />;
  if (index === 2) return <Sparkles className='size-3 text-primary' />;
  return <Minus className='size-3 text-muted-foreground' />;
};

export function RightTrending({ items, communities }: { items: TrendingItem[]; communities: SearchTagSuggestion[] }) {
  return (
    <div className='space-y-4'>
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <TrendingUp className='size-3 text-primary' />
        Trending Posts
      </h3>
      <div className='space-y-2'>
        {items.map((t, index) => (
          <Link key={t.rank} href={`/?q=${encodeURIComponent(t.title)}`} className='group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm celestia-hover-surface'>
            <span className='w-4 shrink-0 text-right font-mono text-[10px] text-muted-foreground/60'>{t.rank}</span>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium leading-snug text-card-foreground transition-colors group-hover:text-foreground'>
                {t.title}
              </p>
              <p className='font-mono text-[11px] text-muted-foreground'>{t.postCount} posts</p>
            </div>
            <MomentumIcon index={index} />
          </Link>
        ))}
        <Link href='/?sort=hot' className='inline-block px-2 pt-2 text-xs font-medium text-primary hover:text-primary-hover'>
          View all
        </Link>
      </div>
    </section>
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <span className='size-1.5 rounded-full bg-success shadow-[0_0_6px] shadow-success/40' />
        Active Now
      </h3>
      <div className='flex items-center'>
        {['N', 'Q', 'L', 'C', 'A'].map((label, index) => (
          <span
            key={label}
            className='grid size-8 place-items-center rounded-full border-2 border-card bg-primary/15 text-xs font-semibold text-primary'
            style={{ marginLeft: index ? -8 : 0, zIndex: 10 - index }}
          >
            {label}
          </span>
        ))}
        <span className='ml-3 text-xs text-muted-foreground'>+42 online</span>
      </div>
    </section>
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <Users className='size-3 text-accent' />
        Top Communities
      </h3>
      <div className='space-y-2.5'>
        {communities.slice(0, 3).map((community) => (
          <Link key={community.slug} href={`/r/${encodeURIComponent(community.slug)}`} className='flex items-center gap-2.5 rounded-xl px-1 py-1 celestia-hover-surface'>
            <span
              className='grid size-8 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-xs font-bold text-primary'
              style={{ color: community.hashColor }}
            >
              {community.label[0]}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium text-foreground'>r/{community.slug}</p>
              <p className='text-[10px] text-muted-foreground'>{community.postCount} posts</p>
            </div>
            <span className='h-1 w-10 rounded-full bg-primary/40' />
          </Link>
        ))}
      </div>
    </section>
    </div>
  );
}
