'use client';

import { getProfileByUserName } from '@/services';
import { useQuery } from '@tanstack/react-query';

export const useGetProfile = (username: string) => {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUserName(({ username })),
    enabled: Boolean(username),
  });
};