'use client';

import type { FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LaptopMinimal, LogOut, MonitorCog, Moon, Settings, Sun, UserRoundCog } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { useSession } from '@/hooks/useSession';
import { useGetProfile } from '@/hooks/useQueries';

const displayModeOptions = [
  { value: 'system', label: 'System', icon: LaptopMinimal },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
] as const;

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.split('@')[0] || 'User';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const AccountMenu: FC = () => {
  const supabase = useSession().supabase;
  const { data: userData } = useGetProfile();
  const { theme = 'system', setTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const name = userData?.data?.username;
  const email = userData?.data?.email;
  const avatarUrl = userData?.data?.avatarUrl;
  const profileHref = name ? `/u/${encodeURIComponent(name)}` : '/profile';

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.replace('/');
  };

  return (
    <DropdownMenu open={isAccountMenuOpen} onOpenChange={setIsAccountMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className='inline-flex size-8 shrink-0 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-02 cursor-pointer'
        >
          <Avatar>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
          </Avatar>
          <span className='sr-only'>Open account menu</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 space-y-2 p-3'>
        <DropdownMenuLabel className='flex items-center gap-3'>
          <Link href={profileHref} onClick={() => setIsAccountMenuOpen(false)} className='flex gap-1 justify-start'>
            <Avatar className='size-10'>
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
            </Avatar>
            <span className='min-w-0 space-y-1.5'>
              <span className='block truncate text-sm font-medium text-foreground'>View Profile</span>
              <span className='block truncate text-xs font-normal text-muted-foreground'>u/{name}</span>
            </span>
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='mb-2' />
        <DropdownMenuItem asChild className='rounded-none py-2'>
          <Link href='/profile/settings' onClick={() => setIsAccountMenuOpen(false)}>
            <UserRoundCog className='size-4' />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='rounded-none py-2'>
          <Link href='/settings' onClick={() => setIsAccountMenuOpen(false)}>
            <Settings className='size-4' />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='rounded-none py-2'>
            <MonitorCog className='size-4' />
            Display mode
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className='w-40'>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              {displayModeOptions.map(({ value, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={value} value={value} className='py-2 pl-2 pr-8'>
                  <Icon className='size-4' />
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator className='mb-2' />
        <DropdownMenuItem onSelect={handleSignOut} disabled={isSigningOut} className='gap-2 rounded-none'>
          <LogOut className='size-4' />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
