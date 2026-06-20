import type { FC } from 'react';
import { cn } from '@/lib/utils';
import type { StatGridProps } from '@/lib/types';

export const StatGrid: FC<StatGridProps> = ({ stats, className }: StatGridProps) => {
  return (
    <div className={cn('grid grid-cols-3 gap-2 text-sm', className)}>
      {stats.map(({ label, value }) => (
        <div key={label} className='rounded border border-border bg-muted/40 px-3 py-2'>
          <p className='font-mono text-sm font-semibold text-foreground'>{value}</p>
          <p className='text-[11px] text-muted-foreground'>{label}</p>
        </div>
      ))}
    </div>
  );
};
