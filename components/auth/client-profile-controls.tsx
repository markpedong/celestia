'use client';

import { AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetProfile } from '@/hooks/useQueries';
import Link from 'next/link';

export const ClientProfileControls = ({ profileId }: { profileId: string }) => {
  const user = useGetProfile().data?.data;
  const isSelf = user?.id === profileId;

  return isSelf ? (
    <Button asChild size='sm' className='celestia-primary-action rounded-lg'>
      <Link href='/profile/settings'>Edit profile</Link>
    </Button>
  ) : (
    <Button variant='outline' size='sm' className='rounded-full'>
      <AtSign className='size-3.5' />
      Follow
    </Button>
  );
};
