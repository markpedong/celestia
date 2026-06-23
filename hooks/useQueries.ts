'use client';

import { STALE_TIME } from '@/constants';
import { getProfileByUserName } from '@/services';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { useSession } from './useSession';

const getUserNameByAuth = (user?: Session['user']) => user?.email?.split('@')[0] ?? '';

export const useGetProfile = () => {
  const { user: authUser } = useSession();
  const username = getUserNameByAuth(authUser);

  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUserName({ username }),
    enabled: Boolean(username),
    staleTime: STALE_TIME
  });
};
