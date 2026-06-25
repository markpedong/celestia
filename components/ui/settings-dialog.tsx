'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type SettingsDialogProps = ComponentProps<typeof Dialog> & {
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
};

const SettingsDialog = ({ children, contentClassName, description, title, ...props }: SettingsDialogProps) => (
  <Dialog {...props}>
    <DialogContent className={cn(contentClassName)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>

      <div className='[&_input]:bg-background'>{children}</div>
    </DialogContent>
  </Dialog>
);

export default SettingsDialog;
