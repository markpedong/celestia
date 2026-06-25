'use client';

import { STALE_TIME } from '@/constants';
import { getCommunity, getCommunityFeed, getCommunityMember, getCommunityStats, getProfileByUserName, joinCommunity, updateCommunity } from '@/services';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { useSession } from './useSession';
import type { FeedSort, Tag } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

export const useGetCommunity = (slug: string) => {
  return useQuery({
    queryKey: ['community', slug],
    queryFn: () => getCommunity(slug),
    staleTime: STALE_TIME,
  });
};

export const useUpdateCommunity = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (body: Tag & { description: string }) => updateCommunity(body),
    onSuccess: (res, variables) => {
      if (!res.success) {
        toast.error(res.message || 'Unable to update community settings.');
        return;
      }

      toast.success('Community settings saved.');
      router.refresh();
      router.push(`/r/${variables.slug}`);
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to update community settings.');
    },
  });
};


export const useCommunityFeed = (slug: string, sort: FeedSort) => {
  return useQuery({
    queryKey: ['community-feed', slug, sort],
    queryFn: () => getCommunityFeed(slug, sort),
    staleTime: STALE_TIME,
  });
};

export const useGetCommunityStats = (slug: string) => {
  return useQuery({
    queryKey: ['community-stats', slug],
    queryFn: () => getCommunityStats(slug),
    staleTime: STALE_TIME,
  });
}

export const useCommunityJoin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (slug: string) => joinCommunity(slug),
    onSuccess: () => router.refresh(),
  });
};

export const useGetCommunityMember = (slug: string) => {
  return useQuery({
    queryKey: ['community-member', slug],
    queryFn: () => getCommunityMember(slug),
    staleTime: STALE_TIME,
  })
}
