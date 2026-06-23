import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsOptionRowProps = React.ComponentProps<'button'> & {
  title: string;
  description?: string;
  value?: string | null;
};

export const SettingsOptionRow = ({ title, description, value, className, type = 'button', ...props }: SettingsOptionRowProps) => (
  <button
    type={type}
    className={cn('group flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', className)}
    {...props}
  >
    <span className='min-w-0 flex-1'>
      <span className='block text-sm font-medium text-foreground'>{title}</span>
      {description || value ? <span className='mt-0.5 block truncate text-sm text-muted-foreground'>{description ?? value}</span> : null}
    </span>
    <ChevronRight className='size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5' aria-hidden='true' />
  </button>
);
