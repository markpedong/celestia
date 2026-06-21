'use client';

import { AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileMediaEditButton } from '@/components/profile/profile-media-editor';
import { useSession } from '@/hooks/useSession';

export const ClientProfileControls = ({ profileId }: { profileId: string }) => {
  const { user } = useSession();
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
