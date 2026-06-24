'use client';

import { STALE_TIME } from '@/constants';
import { getCommunityFeed, getProfileByUserName } from '@/services';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { useSession } from './useSession';
import type { FeedSort } from '@/lib/types';

const getUserNameByAuth = (user?: Session['user']) => {
  const userName = user?.user_metadata.userName;
  return typeof userName === 'string' ? userName : user?.email?.split('@')[0] ?? '';
};

export const profileQueryKey = (userName: string) => ['profile', userName] as const;

export const useGetProfile = () => {
  const { user: authUser } = useSession();
  const userName = getUserNameByAuth(authUser);

  return useQuery({
    queryKey: profileQueryKey(userName),
    queryFn: () => getProfileByUserName({ userName }),
    enabled: Boolean(userName),
    staleTime: STALE_TIME,
  });
};

export const useCommunityFeed = (slug: string, sort: FeedSort) => {
  return useQuery({
    queryKey: ['community-feed', slug, sort],
    queryFn: () => getCommunityFeed(slug, sort),
    staleTime: STALE_TIME,
  });
};
