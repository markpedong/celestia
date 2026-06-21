'use client';

import { useEffect, useState } from 'react';
import { AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileMediaEditButton } from '@/components/profile/profile-media-editor';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

const supabase = createSupabaseBrowserClient();

export const ClientProfileControls = ({ profileId }: { profileId: string }) => {
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setIsSelf(data.user?.id === profileId);
    };

    void loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => void loadUser());
    return () => subscription.unsubscribe();
  }, [profileId]);

  return isSelf ? (
    <ProfileMediaEditButton />
  ) : (
    <Button variant='outline' size='sm' className='rounded-full'>
      <AtSign className='size-3.5' />
      Follow
    </Button>
  );
};
