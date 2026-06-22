'use client';

import { STALE_TIME } from '@/constants';
import { getProfileByUserName } from '@/services';
import { useQuery } from '@tanstack/react-query';
import { useSession } from './useSession';
import { getUserNameByAuth } from '@/constants/helpers';

export const useGetProfile = () => {
  const { user: authUser } = useSession();
  const username = getUserNameByAuth(authUser);

  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUserName(({ username })),
    enabled: Boolean(username),
    staleTime: STALE_TIME
  });
};