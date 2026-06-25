'use client';

import { STALE_TIME } from '@/constants';
import { getCommunity, getCommunityFeed, getCommunityMember, getCommunityStats, getProfileByUserName, joinCommunity, updateCommunity, updateProfile } from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { useSession } from './useSession';
import type { ApiResponse, CommunityStats, FeedSort, Tag } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const getUserNameByAuth = (user?: Session['user']) => {
  const userName = user?.user_metadata.userName;
  return typeof userName === 'string' ? userName : user?.email?.split('@')[0] ?? '';
};

export const communityMemberQueryKey = (slug: string) => ['community-member', slug] as const;
export const communityStatsQueryKey = (slug: string) => ['community-stats', slug] as const;

export const useGetProfile = () => {
  const { user: authUser } = useSession();
  const username = getUserNameByAuth(authUser);

  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUserName({ username }),
    enabled: Boolean(username),
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

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: res => {
      if (!res.success) {
        toast.error(res.message || 'Unable to update profile.');
        return;
      }

      toast.success(res.message || 'Profile updated.');

      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to update profile.');
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
    queryKey: communityStatsQueryKey(slug),
    queryFn: () => getCommunityStats(slug),
    staleTime: STALE_TIME,
  });
}

export const useCommunityJoin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => joinCommunity(slug),
    onMutate: async slug => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: communityMemberQueryKey(slug) }),
        queryClient.cancelQueries({ queryKey: communityStatsQueryKey(slug) }),
      ]);

      const previousMember = queryClient.getQueryData<ApiResponse<{ isMember: boolean }>>(communityMemberQueryKey(slug));
      const previousStats = queryClient.getQueryData<ApiResponse<CommunityStats>>(communityStatsQueryKey(slug));
      const nextIsMember = !previousMember?.data?.isMember;
      const memberDelta = nextIsMember ? 1 : -1;

      queryClient.setQueryData<ApiResponse<{ isMember: boolean }>>(communityMemberQueryKey(slug), current => ({
        message: current?.message ?? 'Data fetched successfully',
        success: current?.success ?? true,
        data: { isMember: nextIsMember },
      }));
      queryClient.setQueryData<ApiResponse<CommunityStats>>(communityStatsQueryKey(slug), current => {
        if (!current?.data) return current;
        return {
          ...current,
          data: {
            ...current.data,
            memberCount: Math.max(0, current.data.memberCount + memberDelta),
          },
        };
      });

      return { previousMember, previousStats };
    },
    onSuccess: (response, slug, context) => {
      if (!response.success || !response.data) {
        if (context?.previousMember) queryClient.setQueryData(communityMemberQueryKey(slug), context.previousMember);
        if (context?.previousStats) queryClient.setQueryData(communityStatsQueryKey(slug), context.previousStats);
        toast.error(response.message || 'Unable to update community membership.');
        return;
      }

      queryClient.setQueryData<ApiResponse<{ isMember: boolean }>>(communityMemberQueryKey(slug), {
        ...response,
        data: { isMember: response.data.isMember },
      });
      void queryClient.invalidateQueries({ queryKey: communityStatsQueryKey(slug) });
      void queryClient.invalidateQueries({ queryKey: ['community-feed', slug] });
      router.refresh();
    },
    onError: (error, slug, context) => {
      if (context?.previousMember) queryClient.setQueryData(communityMemberQueryKey(slug), context.previousMember);
      if (context?.previousStats) queryClient.setQueryData(communityStatsQueryKey(slug), context.previousStats);
      toast.error(error instanceof Error ? error.message : 'Unable to update community membership.');
    },
    onSettled: (_response, _error, slug) => {
      void queryClient.invalidateQueries({ queryKey: communityMemberQueryKey(slug) });
      void queryClient.invalidateQueries({ queryKey: communityStatsQueryKey(slug) });
    },
  });
};

export const useGetCommunityMember = (slug: string) => {
  return useQuery({
    queryKey: communityMemberQueryKey(slug),
    queryFn: () => getCommunityMember(slug),
    enabled: Boolean(slug),
    staleTime: STALE_TIME,
  })
}
