import { ChevronRight } from 'lucide-react';
import classNames from 'classnames';
import styles from './settings-option-row.module.scss';

type SettingsOptionRowProps = React.ComponentProps<'button'> & {
  title: string;
  description?: string;
  value?: string | null;
};

export const SettingsOptionRow = ({ title, description, value, className, type = 'button', ...props }: SettingsOptionRowProps) => (
  <button
    type={type}
    className={classNames('group', styles.row, className)}
    {...props}
  >
    <span className={styles.content}>
      <span className={styles.title}>{title}</span>
      {description || value ? <span className={styles.description}>{description ?? value}</span> : null}
    </span>
    <ChevronRight className={styles.icon} aria-hidden='true' />
  </button>
);
