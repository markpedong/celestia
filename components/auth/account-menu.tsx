'use client';

import type { FC } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
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
import { Bookmark, EyeOff, LaptopMinimal, LogOut, MonitorCog, Moon, Settings, Sun } from 'lucide-react';
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

const AccountMenu: FC = () => {
  const supabase = useSession().supabase;
  const { data: userData } = useGetProfile();
  const { theme = 'system', setTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = userData?.data;
  const name = user?.userName;
  const profileHref = name ? `/u/${encodeURIComponent(name)}` : '/profile';

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.replace('/');
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isAccountMenuOpen} onOpenChange={setIsAccountMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className='inline-flex size-8 shrink-0 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-02 cursor-pointer'
        >
          <UserAvatar user={user} />
          <span className='sr-only'>Open account menu</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 space-y-2 p-3'>
        <DropdownMenuLabel className='flex items-center gap-3'>
          <Link href={profileHref} onClick={() => setIsAccountMenuOpen(false)} className='flex gap-1 justify-start'>
            <UserAvatar user={user} size='lg' />
            <span className='min-w-0 space-y-1.5'>
              <span className='block truncate text-sm font-medium text-foreground'>View Profile</span>
              <span className='block truncate text-xs font-normal text-muted-foreground'>u/{name}</span>
            </span>
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='mb-2' />
        <DropdownMenuItem asChild className='rounded-none py-2'>
          <Link href='/settings' onClick={() => setIsAccountMenuOpen(false)}>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='rounded-none py-2'>
          <Link href='/saved' onClick={() => setIsAccountMenuOpen(false)}>
            <Bookmark /> Saved
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='rounded-none py-2'>
          <Link href='/hidden' onClick={() => setIsAccountMenuOpen(false)}>
            <EyeOff /> Hidden
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='rounded-none py-2'>
            <MonitorCog />
            Display mode
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className='w-40'>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              {displayModeOptions.map(({ value, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={value} value={value} className='py-2 pl-2 pr-8'>
                  <Icon />
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator className='mb-2' />
        <DropdownMenuItem onSelect={handleSignOut} disabled={isSigningOut} className='gap-2 rounded-none'>
          <LogOut />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
