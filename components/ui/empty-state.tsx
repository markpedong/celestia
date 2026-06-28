import type { FC } from 'react';
import classNames from 'classnames';
import type { EmptyStateProps } from '@/lib/types';
import styles from './empty-state.module.scss';

export const EmptyState: FC<EmptyStateProps> = ({ icon: Icon, title, description, className, children }) => {
  return (
    <div className={classNames('celestia-card', styles.root, className)}>
      <Icon className={styles.icon} aria-hidden />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
      {children ? <div className={styles.children}>{children}</div> : null}
    </div>
  );
};
