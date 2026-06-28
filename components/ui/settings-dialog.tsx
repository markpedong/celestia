'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import classNames from 'classnames';
import styles from './settings-dialog.module.scss';

type SettingsDialogProps = ComponentProps<typeof Dialog> & {
  title: string;
  description?: string;
  children: ReactNode;
  contentClassName?: string;
};

const SettingsDialog = ({ children, contentClassName, description, title, ...props }: SettingsDialogProps) => (
  <Dialog {...props}>
    <DialogContent className={classNames(styles.content, contentClassName)}>
      <DialogHeader className={styles.header}>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>

      <div className={styles.body}>{children}</div>
    </DialogContent>
  </Dialog>
);

export default SettingsDialog;
