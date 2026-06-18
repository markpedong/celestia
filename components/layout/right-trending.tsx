import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TrendingItem } from '@/lib/trending';
import { Flame, Minus, Sparkles, TrendingUp } from 'lucide-react';

const MomentumIcon = ({ index }: { index: number }) => {
  if (index === 0) return <Flame className='size-3 text-amber-400' />;
  if (index === 1) return <TrendingUp className='size-3 text-emerald-400' />;
  if (index === 2) return <Sparkles className='size-3 text-primary' />;
  return <Minus className='size-3 text-muted-foreground' />;
};

export function RightTrending({ items }: { items: TrendingItem[] }) {
  return (
    <Card className='border-border bg-card shadow-[0_0_36px_rgba(124,106,247,0.05)]'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
          <TrendingUp className='size-3' />
          Rising Signals
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-1 pt-0'>
        {items.map((t, index) => (
          <div key={t.rank} className='group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-white/5'>
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
      </CardContent>
    </Card>
  );
}
