'use client';

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
import { createAuthClient } from '@neondatabase/auth/next';
import { LaptopMinimal, LogOut, MonitorCog, Moon, Sun, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const authClient = createAuthClient();
const DISPLAY_MODE_STORAGE_KEY = 'celestia-display-mode';

const displayModeOptions = [
  { value: 'system', label: 'System', icon: LaptopMinimal },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
] as const;

type DisplayMode = (typeof displayModeOptions)[number]['value'];

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

const AccountMenu = ({ avatarUrl }: { avatarUrl?: string }) => {
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }

    const storedMode = window.localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);

    return storedMode === 'system' || storedMode === 'dark' || storedMode === 'light' ? storedMode : 'system';
  });
  const user = session?.user;

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
    await authClient.signOut();
    window.location.replace('/');
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type='button' className='inline-flex size-8 shrink-0 items-center justify-center rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
          <Avatar>
            <AvatarImage src={avatarUrl ?? user.image ?? undefined} alt={user.name || user.email} />
            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
          <span className='sr-only'>Open account menu</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64 space-y-2 p-3'>
        <DropdownMenuLabel className='space-y-1.5 px-3 py-2.5'>
          <span className='block truncate text-sm font-medium text-foreground'>{user.name || 'Celestia user'}</span>
          <span className='block truncate text-xs font-normal text-muted-foreground'>{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuItem asChild className='rounded-none px-3 py-2.5'>
          <Link href='/profile'>
            <UserRound className='size-4' />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className='rounded-none px-3 py-2.5'>
            <MonitorCog className='size-4' />
            Display mode
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className='w-40'>
            <DropdownMenuRadioGroup value={displayMode} onValueChange={(value) => setDisplayMode(value as DisplayMode)}>
              {displayModeOptions.map(({ value, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={value} value={value} className='py-2 pl-2 pr-8'>
                  <Icon className='size-4' />
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={isSigningOut} className='gap-2 rounded-none px-3 py-2.5'>
          <LogOut className='size-4' />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
