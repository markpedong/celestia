import type { FC } from 'react';
import type { UserAvatarProps } from '@/lib/types';
import classNames from 'classnames';
import Image from 'next/image';
import styles from './user-avatar.module.scss';

export const UserAvatar: FC<UserAvatarProps> = ({ user, size = 'default', className }) => {
  const label = user.displayName ?? user.userName;

  return (
    <span className={classNames(styles.root, styles.defaultSize, {
      [styles.small]: size === 'sm',
      [styles.large]: size === 'lg',
    }, className)}>
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} width={20} height={20} unoptimized className={styles.image} alt={label} />
      ) : (
        <span
          className={classNames(styles.fallback, {
            [styles.smallText]: size === 'sm',
            [styles.largeText]: size === 'lg',
          })}
        >
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
};
