import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';

type Props = {
  user: User;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

export function UserAvatar({ user, size = 'default', className }: Props) {
  const label = user.displayName ?? user.username;

  return (
    <Avatar size={size} className={className}>
      <AvatarImage src={user.avatarUrl} alt={label} />
      <AvatarFallback className={cn('bg-primary/15 font-semibold text-primary', size === 'lg' && 'text-base')}>
        {label.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
