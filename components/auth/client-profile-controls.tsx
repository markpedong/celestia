'use client';

import { AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileMediaEditButton } from '@/components/profile/profile-media-editor';
import { useGetProfile } from '@/hooks/useQueries';

export const ClientProfileControls = ({ profileId }: { profileId: string }) => {
  const user = useGetProfile().data?.data;
  const isSelf = user?.id === profileId;

  return isSelf ? (
    <ProfileMediaEditButton />
  ) : (
    <Button variant='outline' size='sm' className='rounded-full'>
      <AtSign className='size-3.5' />
      Follow
    </Button>
  );
};
