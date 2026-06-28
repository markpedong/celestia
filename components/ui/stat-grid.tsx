import type { FC } from 'react';
import classNames from 'classnames';
import type { StatGridProps } from '@/lib/types';
import styles from './stat-grid.module.scss';

export const StatGrid: FC<StatGridProps> = ({ stats, className }) => {
  return (
    <div className={classNames(styles.grid, className)}>
      {stats.map(({ label, value }) => (
        <div key={label} className={styles.item}>
          <p className={styles.value}>{value}</p>
          <p className={styles.label}>{label}</p>
        </div>
      ))}
    </div>
  );
};
