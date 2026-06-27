'use client';

import { AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetProfile } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';

export const ClientProfileControls = ({ profileID }: { profileID: string }) => {
  const { session } = useSession();
  const { data } = useGetProfile();
  const user = data?.data;
  const isSignedIn = session === undefined ? Boolean(user) : Boolean(session);
  const isSelf = user?.id === profileID;

  return !isSignedIn || isSelf ? (
    null
  ) : (
    <Button variant='outline' size='sm'>
      <AtSign />
      Follow
    </Button>
  );
};
