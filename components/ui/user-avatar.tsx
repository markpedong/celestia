import type { FC } from 'react';
import type { UserAvatarProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export const UserAvatar: FC<UserAvatarProps> = ({ user, size = 'default', className }) => {
  const label = user.displayName ?? user.userName;
  const avatarUrl = user.avatar_url ?? user.avatarUrl;
  const sizeClass = size === 'sm' ? 'size-6' : size === 'lg' ? 'size-10' : 'size-8';

  return (
    <span className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizeClass, className)}>
      {avatarUrl ? (
        <Image src={avatarUrl} width={20} height={20} className='size-full rounded-full object-cover' alt={label} />
      ) : (
        <span
          className={cn(
            'flex size-full items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary',
            size === 'sm' && 'text-xs',
            size === 'lg' && 'text-base'
          )}
        >
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
};
