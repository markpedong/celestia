'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createAuthClient } from '@neondatabase/auth/next';
import { LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const authClient = createAuthClient();

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.split('@')[0] || 'User';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const AccountMenu = () => {
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const user = session?.user;

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
        <button type='button' className='rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'>
          <Avatar>
            <AvatarImage src={user.image ?? undefined} alt={user.name || user.email} />
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
          <Link href='/auth/sign-in'>
            <UserRound className='size-4' />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut} disabled={isSigningOut} className='gap-2 rounded-none px-3 py-2.5'>
          <LogOut className='size-4' />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
