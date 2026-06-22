'use client';

import { STALE_TIME } from '@/constants';
import { getProfileByUserName } from '@/services';
import { useQuery } from '@tanstack/react-query';

export const useGetProfile = (username: string) => {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUserName(({ username })),
    enabled: Boolean(username),
    staleTime: STALE_TIME
  });
};