'use client';

import { Toaster as Sonner } from 'sonner';

export const Toaster = () => (
  <Sonner
    closeButton
    position='bottom-center'
    toastOptions={{
      classNames: {
        toast: '!border-border !bg-popover !text-popover-foreground !shadow-lg',
        title: '!text-popover-foreground',
        description: '!text-muted-foreground',
        actionButton: '!bg-primary !text-primary-foreground hover:!bg-primary-hover',
        closeButton: '!border-border !bg-popover !text-popover-foreground',
      },
    }}
  />
);
