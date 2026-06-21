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
import type { AccountMenuProps, DisplayMode } from '@/lib/types';
import { LaptopMinimal, LogOut, MonitorCog, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/useSession';

const DISPLAY_MODE_STORAGE_KEY = 'celestia-display-mode';

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

const getResolvedMode = (displayMode: DisplayMode) => {
  if (displayMode !== 'system') {
    return displayMode;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyDisplayMode = (displayMode: DisplayMode) => {
  const resolvedMode = getResolvedMode(displayMode);
  const root = document.documentElement;

  root.classList.toggle('dark', resolvedMode === 'dark');
  root.classList.toggle('light', resolvedMode === 'light');
  root.style.colorScheme = resolvedMode;
};

const AccountMenu: FC<AccountMenuProps> = ({ initialUser }: AccountMenuProps) => {
  const { supabase, user } = useSession();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }

    const storedMode = window.localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);

    return storedMode === 'system' || storedMode === 'dark' || storedMode === 'light' ? storedMode : 'system';
  });
  useEffect(() => {
    applyDisplayMode(displayMode);
    window.localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, displayMode);

    if (displayMode !== 'system') {
      return;
    }

    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = () => applyDisplayMode('system');

    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);

    return () => {
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, [displayMode]);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.replace('/');
  };

  const name =
    (typeof user?.user_metadata.full_name === 'string' && user.user_metadata.full_name) ||
    initialUser.displayName ||
    initialUser.username;
  const email = user?.email;
  const avatarUrl =
    initialUser.avatarUrl ??
    (typeof user?.user_metadata.avatar_url === 'string' ? user.user_metadata.avatar_url : undefined);

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
          <Link href='/profile' onClick={() => setIsAccountMenuOpen(false)} className='flex gap-1 justify-start'>
            <Avatar className='size-10'>
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
            </Avatar>
            <span className='min-w-0 space-y-1.5'>
              <span className='block truncate text-sm font-medium text-foreground'>View Profile</span>
              <span className='block truncate text-xs font-normal text-muted-foreground'>u/{initialUser.username}</span>
            </span>
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='mb-2' />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='rounded-none py-2'>
            <MonitorCog className='size-4' />
            Display mode
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className='w-40'>
            <DropdownMenuRadioGroup value={displayMode} onValueChange={value => setDisplayMode(value as DisplayMode)}>
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
