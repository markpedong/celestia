import type { FC } from 'react';
import { cn } from '@/lib/utils';
import type { EmptyStateProps } from '@/lib/types';

export const EmptyState: FC<EmptyStateProps> = ({ icon: Icon, title, description, className, children }: EmptyStateProps) => {
  return (
    <div className={cn('celestia-card px-6 py-16 text-center', className)}>
      <Icon className='mx-auto mb-3 size-8 text-primary' aria-hidden />
      <h2 className='text-base font-semibold'>{title}</h2>
      <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
      {children ? <div className='mt-4'>{children}</div> : null}
    </div>
  );
};
