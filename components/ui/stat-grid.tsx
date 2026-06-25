import type { FC } from 'react';
import { cn } from '@/lib/utils';
import type { StatGridProps } from '@/lib/types';

export const StatGrid: FC<StatGridProps> = ({ stats, className }) => {
  return (
    <div className={cn('grid grid-cols-3 gap-2 text-sm', className)}>
      {stats.map(({ label, value }) => (
        <div key={label} className='rounded border border-border bg-muted/35 px-3 py-3 shadow-inner shadow-background/20'>
          <p className='font-mono text-base font-bold text-foreground'>{value}</p>
          <p className='mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>{label}</p>
        </div>
      ))}
    </div>
  );
};
