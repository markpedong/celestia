import Link from 'next/link';
import type { TrendingItem } from '@/lib/trending';
import { Flame, Minus, Sparkles, TrendingUp, Users } from 'lucide-react';

const MomentumIcon = ({ index }: { index: number }) => {
  if (index === 0) return <Flame className='size-3 text-amber-400' />;
  if (index === 1) return <TrendingUp className='size-3 text-emerald-400' />;
  if (index === 2) return <Sparkles className='size-3 text-primary' />;
  return <Minus className='size-3 text-muted-foreground' />;
};

export function RightTrending({ items }: { items: TrendingItem[] }) {
  return (
    <div className='space-y-4'>
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <TrendingUp className='size-3 text-primary' />
        Trending Signals
      </h3>
      <div className='space-y-2'>
        {items.map((t, index) => (
          <div key={t.rank} className='group flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-white/5'>
            <span className='w-4 shrink-0 text-right font-mono text-[10px] text-muted-foreground/60'>{t.rank}</span>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium leading-snug text-card-foreground transition-colors group-hover:text-white'>
                {t.title}
              </p>
              <p className='font-mono text-[11px] text-muted-foreground'>{t.postCount} signals</p>
            </div>
            <MomentumIcon index={index} />
          </div>
        ))}
        <Link href='/?sort=hot' className='inline-block px-2 pt-2 text-xs font-medium text-primary hover:text-primary-hover'>
          View orbit
        </Link>
      </div>
    </section>
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <span className='size-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]' />
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
        <Users className='size-3 text-cyan-300' />
        Top Communities
      </h3>
      <div className='space-y-2.5'>
        {['Technology', 'Space', 'Science'].map((label, index) => (
          <div key={label} className='flex items-center gap-2.5'>
            <span className='grid size-8 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-xs font-bold text-primary'>
              {label[0]}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium text-foreground'>{label}</p>
              <p className='text-[10px] text-muted-foreground'>{['12.6k', '9.8k', '7.4k'][index]} members</p>
            </div>
            <span className='h-1 w-10 rounded-full bg-primary/40' />
          </div>
        ))}
      </div>
    </section>
    </div>
  );
}
