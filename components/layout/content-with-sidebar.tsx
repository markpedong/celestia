import type { FC } from 'react';
import classNames from 'classnames';
import type { ContentWithSidebarProps } from '@/lib/types';
import styles from './content-with-sidebar.module.scss';

export const ContentWithSidebar: FC<ContentWithSidebarProps> = ({ children, sidebar, className, contentClassName, sidebarClassName }) => {
  return (
    <div className={classNames(styles.root, className)}>
      <div className={classNames(styles.content, contentClassName)}>{children}</div>
      <aside className={classNames(styles.sidebar, sidebarClassName)}>
        <div className={styles.sidebarInner}>{sidebar}</div>
      </aside>
    </div>
  );
};
