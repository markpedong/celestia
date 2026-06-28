'use client';

import { STALE_TIME } from '@/constants';
import { createComment, createCommunity, createPost, getChatConversations, getChatMessages, getCommunity, getCommunityFeed, getCommunityMember, getCommunityStats, getOwnedCommunities, getProfile, joinCommunity, markChatRead, sendChatMessage, startDirectConversation, updateCommunity, updatePost, updateProfile, uploadImages, vote } from '@/services';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useSession } from './useSession';
import type { ApiResponse, ChatConversation, ChatMessagesPage, CommentFormState, CommunityStats, FeedSort, ImageBucket, User, VoteActionValue, VoteTarget } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OPEN_CHAT_EVENT, PENDING_DIRECT_CONVERSATION_PREFIX, type OpenChatEventDetail } from '@/lib/chat-events';

export const communityMemberQueryKey = (slug: string) => ['community-member', slug] as const;
export const communityStatsQueryKey = (slug: string) => ['community-stats', slug] as const;
export const chatConversationsQueryKey = ['chat-conversations'] as const;
export const chatMessagesQueryKey = (conversationID: string) => ['chat-messages', conversationID] as const;

export const useGetProfile = () => {
  const { user: authUser } = useSession();

  return useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: getProfile,
    enabled: Boolean(authUser?.id),
    staleTime: STALE_TIME,
  });
};

export const useGetOwnedCommunities = (profileID: string, enabled = true) => {
  return useQuery({
    queryKey: ['profile-owned-communities', profileID],
    queryFn: () => getOwnedCommunities(profileID),
    enabled: Boolean(profileID) && enabled,
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
    mutationFn: (body: Parameters<typeof updateCommunity>[0]) => updateCommunity(body),
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

export const useCreateCommunity = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: (body: Parameters<typeof createCommunity>[0]) => createCommunity(body),
    onSuccess: res => {
      if (!res.success || !res.data) {
        toast.error(res.message || 'Unable to create community.');
        return;
      }

      toast.success('Community created.');
      router.refresh();
      router.push(`/r/${res.data.slug}`);
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to create community.');
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

export const useChatConversations = () => {
  const { user } = useSession();

  return useQuery({
    queryKey: chatConversationsQueryKey,
    queryFn: getChatConversations,
    enabled: Boolean(user?.id),
    staleTime: STALE_TIME,
  });
};

export const useChatMessages = (conversationID: string | null) => {
  return useInfiniteQuery({
    queryKey: chatMessagesQueryKey(conversationID ?? 'none'),
    queryFn: ({ pageParam }) => getChatMessages(conversationID!, pageParam),
    enabled: Boolean(conversationID) && !conversationID?.startsWith(PENDING_DIRECT_CONVERSATION_PREFIX),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.data?.nextCursor ?? undefined,
    staleTime: STALE_TIME,
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  const profile = useGetProfile().data?.data;

  return useMutation({
    mutationFn: sendChatMessage,
    onMutate: async body => {
      if (!profile) return;

      const queryKey = chatMessagesQueryKey(body.conversationID);
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<InfiniteData<ApiResponse<ChatMessagesPage>>>(queryKey);
      const now = new Date().toISOString();
      const optimisticMessage = {
        id: `optimistic:${Date.now()}`,
        conversationID: body.conversationID,
        authorID: profile.id,
        body: body.body.trim(),
        createdAt: now,
        deletedAt: null,
        author: profile,
      };

      queryClient.setQueryData<InfiniteData<ApiResponse<ChatMessagesPage>>>(queryKey, current => {
        const firstPage = current?.pages[0] ?? {
          success: true,
          message: 'Data fetched successfully',
          data: { messages: [], nextCursor: null },
        };

        const pages = current?.pages.length
          ? current.pages.map((page, index) => index === 0 ? {
            ...page,
            data: {
              messages: [...(page.data?.messages ?? []), optimisticMessage],
              nextCursor: page.data?.nextCursor ?? null,
            },
          } : page)
          : [{
            ...firstPage,
            data: { messages: [optimisticMessage], nextCursor: null },
          }];

        return {
          pageParams: current?.pageParams ?? [null],
          pages,
        };
      });

      queryClient.setQueryData<ApiResponse<ChatConversation[]>>(chatConversationsQueryKey, current => current?.data ? {
        ...current,
        data: current.data.map(conversation => conversation.id === body.conversationID ? {
          ...conversation,
          lastMessage: optimisticMessage,
          updatedAt: now,
        } : conversation),
      } : current);

      return { previousMessages, queryKey };
    },
    onSuccess: (response, _body, context) => {
      if (!response.success || !response.data) {
        if (context?.previousMessages) {
          queryClient.setQueryData(context.queryKey, context.previousMessages);
        }
        toast.error(response.message || 'Unable to send message.');
        return;
      }

      void queryClient.invalidateQueries({ queryKey: chatMessagesQueryKey(response.data.conversationID) });
      void queryClient.invalidateQueries({ queryKey: chatConversationsQueryKey });
    },
    onError: (error, _body, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(context.queryKey, context.previousMessages);
      }
      toast.error(error instanceof Error ? error.message : 'Unable to send message.');
    },
  });
};

export const useStartDirectConversation = () => {
  const queryClient = useQueryClient();
  const profile = useGetProfile().data?.data;

  return useMutation({
    mutationFn: (target: User) => startDirectConversation(target.id),
    onMutate: async target => {
      if (!profile) return;

      await queryClient.cancelQueries({ queryKey: chatConversationsQueryKey });
      const previousConversations = queryClient.getQueryData<ApiResponse<ChatConversation[]>>(chatConversationsQueryKey);
      const now = new Date().toISOString();
      const optimisticID = `${PENDING_DIRECT_CONVERSATION_PREFIX}${target.id}`;
      const optimisticConversation: ChatConversation = {
        id: optimisticID,
        type: 'direct',
        communitySlug: null,
        directKey: null,
        label: target.displayName ?? target.userName,
        createdAt: now,
        updatedAt: now,
        community: null,
        participants: [
          { user: profile, lastReadAt: now },
          { user: target, lastReadAt: null },
        ],
        lastMessage: null,
        unreadCount: 0,
      };

      queryClient.setQueryData<ApiResponse<ChatConversation[]>>(chatConversationsQueryKey, current => {
        const existing = current?.data ?? [];
        const conversations = existing.some(row => row.id === optimisticID)
          ? existing
          : [optimisticConversation, ...existing];

        return {
          message: current?.message ?? 'Conversation opening.',
          success: current?.success ?? true,
          data: conversations,
        };
      });

      window.dispatchEvent(new CustomEvent<OpenChatEventDetail>(OPEN_CHAT_EVENT, {
        detail: { conversationID: optimisticID },
      }));

      return { optimisticID, previousConversations };
    },
    onSuccess: (response, _target, context) => {
      if (!response.success || !response.data) {
        if (context?.previousConversations) {
          queryClient.setQueryData(chatConversationsQueryKey, context.previousConversations);
        }
        toast.error(response.message || 'Unable to start conversation.');
        return;
      }

      const conversation = response.data;

      queryClient.setQueryData<ApiResponse<ChatConversation[]>>(chatConversationsQueryKey, current => {
        const existing = current?.data ?? [];
        const withoutDuplicates = existing.filter(row =>
          row.id !== conversation.id && row.id !== context?.optimisticID,
        );

        return {
          message: current?.message ?? response.message,
          success: current?.success ?? true,
          data: [conversation, ...withoutDuplicates],
        };
      });
      void queryClient.invalidateQueries({ queryKey: chatConversationsQueryKey });

      window.dispatchEvent(new CustomEvent<OpenChatEventDetail>(OPEN_CHAT_EVENT, {
        detail: { conversationID: conversation.id },
      }));
    },
    onError: (error, _target, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(chatConversationsQueryKey, context.previousConversations);
      }
      toast.error(error instanceof Error ? error.message : 'Unable to start conversation.');
    },
  });
};

export const useMarkChatRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markChatRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chatConversationsQueryKey });
    },
  });
};

export const useUploadImages = () => {
  return useMutation({
    mutationFn: async ({ files, bucket = 'post-images' }: { files: File[]; bucket?: ImageBucket }) =>
      (await uploadImages(files, bucket)).data?.imageUrls ?? [],
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to upload images.');
    },
  });
};

export const useVote = () => {
  return useMutation({
    mutationFn: (body: { target: VoteTarget; targetID: string; value: VoteActionValue }) => vote(body),
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to vote.');
    },
  });
};

export const useCreateComment = () => {
  return useMutation<CommentFormState, Error, { postID: string; parentID: string | null; body: string }>({
    mutationFn: createComment,
    onError: error => {
      toast.error(error.message || 'Unable to post comment.');
    },
  });
};

export const useCreatePost = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: createPost,
    onSuccess: result => {
      if (!result || 'error' in result) {
        toast.error(result?.error || 'Unable to create post.');
        return;
      }

      router.refresh();
      router.push(`/post/${result.postID}`);
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to create post.');
    },
  });
};

export const useUpdatePost = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: updatePost,
    onSuccess: result => {
      if (!result || 'error' in result) {
        toast.error(result?.error || 'Unable to update post.');
        return;
      }

      router.refresh();
      router.push(`/post/${result.postID}`);
    },
    onError: error => {
      toast.error(error instanceof Error ? error.message : 'Unable to update post.');
    },
  });
};
