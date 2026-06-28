'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetProfile, useStartDirectConversation } from '@/hooks/useQueries';
import { useSession } from '@/hooks/useSession';

export const ClientProfileControls = ({ profileID }: { profileID: string }) => {
  const { session } = useSession();
  const { data } = useGetProfile();
  const startDirectConversation = useStartDirectConversation();
  const user = data?.data;
  const isSignedIn = session === undefined ? Boolean(user) : Boolean(session);
  const isSelf = user?.id === profileID;

  return !isSignedIn || isSelf ? (
    null
  ) : (
    <Button
      variant='outline'
      size='sm'
      isLoading={startDirectConversation.isPending}
      loadingText='Opening'
      onClick={() => startDirectConversation.mutate(profileID)}
    >
      <MessageCircle />
      Chat
    </Button>
  );
};
