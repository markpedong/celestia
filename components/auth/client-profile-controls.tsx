'use client';

import { AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetProfile } from '@/hooks/useQueries';

export const ClientProfileControls = ({ profileID }: { profileID: string }) => {
  const user = useGetProfile().data?.data;
  const isSelf = user?.id === profileID;

  return isSelf ? (
    null
  ) : (
    <Button variant='outline' size='sm'>
      <AtSign />
      Follow
    </Button>
  );
};
