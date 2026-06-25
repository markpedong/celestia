import type { FC } from 'react';
import Link from 'next/link';
import { ActiveNowDynamic } from '@/components/dynamic-import';
import type { RightTrendingProps } from '@/lib/types';
import { Flame, Minus, Sparkles, TrendingUp, Users } from 'lucide-react';
import Image from 'next/image';

export const RightTrending: FC<RightTrendingProps> = ({ items, communities }) => {
  return (
    <div className='space-y-4'>
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <TrendingUp className='size-3 text-primary' />
        Trending Posts
      </h3>
      <div className='space-y-2'>
        {items.map((t, index) => (
          <Link key={t.rank} href={`/?q=${encodeURIComponent(t.title)}`} className='group flex items-center gap-2.5 rounded px-2 py-2 text-sm celestia-hover-surface'>
            <span className='w-4 shrink-0 text-right font-mono text-[10px] text-muted-foreground/60'>{t.rank}</span>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium leading-snug text-card-foreground transition-colors hover:text-foreground'>
                {t.title}
              </p>
              <p className='font-mono text-[11px] text-muted-foreground'>{t.postCount} posts</p>
            </div>
            {index === 0 ? <Flame className='size-3 text-amber-400' /> : index === 1 ? <TrendingUp className='size-3 text-success' /> : index === 2 ? <Sparkles className='size-3 text-primary' /> : <Minus className='size-3 text-muted-foreground' />}
          </Link>
        ))}
        <Link href='/explore' className='inline-block px-2 pt-2 text-xs font-medium text-primary hover:text-primary-hover'>
          View all
        </Link>
      </div>
    </section>
    <ActiveNowDynamic />
    <section className='celestia-card p-4'>
      <h3 className='mb-3 flex items-center gap-2 text-xs font-semibold text-foreground'>
        <Users className='size-3 text-accent' />
        Top Communities
      </h3>
      <div className='space-y-2.5'>
        {communities.slice(0, 3).map((community) => (
          <Link key={community.slug} href={`/r/${encodeURIComponent(community.slug)}`} className='flex items-center gap-2.5 rounded px-1 py-1 celestia-hover-surface'>
            <span className='relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-primary/25 bg-primary/10 text-xs font-bold text-primary'>
              {community.avatarUrl ? (
                <Image
                  src={community.avatarUrl}
                  width={32}
                  height={32}
                  className='size-full object-cover'
                  alt={`${community.label} avatar`}
                />
              ) : (
                <span style={{ color: community.hashColor }}>{community.label[0]}</span>
              )}
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
};
