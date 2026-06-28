'use client';

import { CirclePlus, MessageCircleMore } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGetProfile, useStartDirectConversation } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';
import type { User } from '@/lib/types';

export const ClientProfileControls = ({ profile }: { profile: User }) => {
  const { session } = useSession();
  const { data } = useGetProfile();
  const startDirectConversation = useStartDirectConversation();
  const user = data?.data;
  const isSignedIn = session === undefined ? Boolean(user) : Boolean(session);
  const isSelf = user?.id === profile.id;

  if (isSelf) return null;

  if (!isSignedIn) {
    return (
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          className='h-10 rounded-full border-0 bg-[#1d6df2] px-4 text-sm font-semibold text-white disabled:opacity-100'
          disabled
        >
          <CirclePlus />
          Follow
        </Button>
        <Button
          asChild
          className='h-10 rounded-full border-0 bg-[#30383c] px-4 text-sm font-semibold text-white hover:bg-[#3a4449]'
        >
          <Link href='/auth/sign-in'>
            <MessageCircleMore />
            Start Chat
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        className='h-10 rounded-full border-0 bg-[#1d6df2] px-4 text-sm font-semibold text-white disabled:opacity-100'
        disabled
      >
        <CirclePlus />
        Follow
      </Button>
      <Button
        className='h-10 rounded-full border-0 bg-[#30383c] px-4 text-sm font-semibold text-white hover:bg-[#3a4449]'
        onClick={() => startDirectConversation.mutate(profile)}
      >
        <MessageCircleMore />
        Start Chat
      </Button>
    </div>
  );
};
