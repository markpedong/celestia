import { cn } from '@/lib/utils';

type Stat = {
  label: string;
  value: string;
};

type Props = {
  stats: Stat[];
  className?: string;
};

export function StatGrid({ stats, className }: Props) {
  return (
    <div className={cn('grid grid-cols-3 gap-2 text-sm', className)}>
      {stats.map(({ label, value }) => (
        <div key={label} className='rounded-xl border border-border bg-muted/40 px-3 py-2'>
          <p className='font-mono text-sm font-semibold text-foreground'>{value}</p>
          <p className='text-[11px] text-muted-foreground'>{label}</p>
        </div>
      ))}
    </div>
  );
}
