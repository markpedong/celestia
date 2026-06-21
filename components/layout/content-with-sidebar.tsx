import type { FC } from 'react';
import { cn } from '@/lib/utils';
import type { ContentWithSidebarProps } from '@/lib/types';

export const ContentWithSidebar: FC<ContentWithSidebarProps> = ({ children, sidebar, className, contentClassName, sidebarClassName }) => {
  return (
    <div className={cn('grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]', className)}>
      <div className={cn('min-w-0', contentClassName)}>{children}</div>
      <aside className={cn('hidden xl:block', sidebarClassName)}>
        <div className='sticky top-20 space-y-4'>{sidebar}</div>
      </aside>
    </div>
  );
};
