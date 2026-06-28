'use server';

import {
  ApiResponse,
  ChatConversation,
  ChatMessage,
  ChatMessagesPage,
  CommentFormState,
  Community,
  CommunityFeed,
  CommunityStats,
  FeedSort,
  ImageBucket,
  Tag,
  User,
  VoteActionValue,
  VoteTarget,
  VoteValue,
} from "@/lib/types";
import { __api } from "./request";
import { API_ENDPOINT, REQUEST_METHOD } from "@/constants/enums";


export const getProfile = async () => {
  const response = await __api<User>({
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.USER,
  });

  return response;
};

export const getOwnedCommunities = async (profileID: string) => {
  const response = await __api<Community[]>({
    params: { profileID },
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.USER_OWNED_COMMUNITIES,
  });

  return response;
};

export const listJoinedCommunities = async () => {
  const response = await __api<Community[]>({
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.USER_COMMUNITIES,
  });

  return response.data ?? [];
};

export const getInitialDisplayName = async (): Promise<string> =>
  ((await (await fetch('https://random-word-api.herokuapp.com/word?number=2')).json()) as string[]).join('-');


export const getEmailByUserName = async (userName: string) => {
  const response = await __api<{ email: string }>({
    init: { body: { userName } },
    endpoint: API_ENDPOINT.USERNAME_LOGIN,
  });

  return response.data?.email ?? null;
};


export const getCommunity = async (slug: string) => {
  const response = await __api<Community>({
    params: { slug },
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.COMMUNITY,
    includeCookies: false,
  });

  return response.data;
};

export const updateProfile = async (body: Record<string, unknown>) => {
  return await __api({
    init: { body, method: REQUEST_METHOD.POST, },
    endpoint: API_ENDPOINT.USER,
  });
};

export const createCommunity = async (body: Partial<Tag & { description: string }> & { avatarUrl?: string; coverUrl?: string }) => {
  const response = await __api<{ slug: string }>({
    init: { body, method: REQUEST_METHOD.POST },
    endpoint: API_ENDPOINT.COMMUNITY,
  });

  return response;
};

export const updateCommunity = async (body: Partial<Tag & { description: string }> & { slug: string; avatarUrl?: string; coverUrl?: string }) => {
  const response = await __api({
    init: { body, method: REQUEST_METHOD.PATCH },
    endpoint: API_ENDPOINT.COMMUNITY,
  });

  return response;
};

export const uploadImages = async (files: File[], bucket: ImageBucket = 'post-images') => {
  const formData = new FormData();
  formData.set('bucket', bucket);
  files.forEach(file => formData.append('images', file));

  const response = await __api<{ imageUrls: string[] }>({
    endpoint: API_ENDPOINT.IMAGES,
    init: { body: formData, method: REQUEST_METHOD.POST },
  });

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Unable to upload images.');
  }

  return response as ApiResponse<{ imageUrls: string[] }>;
};

export const removeImages = async (imageUrls: string[], bucket: ImageBucket = 'post-images') => {
  return await __api({
    endpoint: API_ENDPOINT.IMAGES,
    init: { body: { bucket, imageUrls }, method: REQUEST_METHOD.DELETE },
  });
};

export const vote = async (body: { target: VoteTarget; targetID: string; value: VoteActionValue }) => {
  return await __api<{ userVote: VoteValue }>({
    endpoint: API_ENDPOINT.VOTES,
    init: { body, method: REQUEST_METHOD.POST },
  });
};

export const createComment = async (body: { postID: string; parentID: string | null; body: string }) => {
  const response = await __api<NonNullable<CommentFormState>>({
    endpoint: API_ENDPOINT.COMMENTS,
    init: { body, method: REQUEST_METHOD.POST },
  });

  return response.success ? response.data : { error: response.message };
};

type PostMutationResult = { postID: string } | { error: string };

export const createPost = async (body: { title: string; body: string; communitySlug: string; images: string[] }): Promise<PostMutationResult> => {
  const response = await __api<{ postID: string }>({
    endpoint: API_ENDPOINT.POSTS,
    init: { body, method: REQUEST_METHOD.POST },
  });

  return response.success && response.data ? response.data : { error: response.message };
};

export const updatePost = async (body: { postID: string; title: string; body: string; images: string[]; removeImages?: boolean }): Promise<PostMutationResult> => {
  const response = await __api<{ postID: string }>({
    endpoint: API_ENDPOINT.POSTS,
    init: { body, method: REQUEST_METHOD.PATCH },
  });

  return response.success && response.data ? response.data : { error: response.message };
};

export const deletePost = async (postID: string) => {
  return await __api({
    endpoint: API_ENDPOINT.POSTS,
    init: { body: { postID }, method: REQUEST_METHOD.DELETE },
  });
};

export const getCommunityFeed = async (slug: string, sort: FeedSort) => {
  const response = await __api<CommunityFeed>({
    params: { slug, sort },
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.COMMUNITY_FEED,
  });

  return response.data;
};

export const joinCommunity = async (slug: string) => {
  const response = await __api<{ isMember: boolean }>({
    init: { body: { slug }, method: REQUEST_METHOD.POST },
    endpoint: API_ENDPOINT.COMMUNITY_JOIN,
  });

  return response;
};

export const getCommunityStats = async (slug: string) => {
  const response = await __api<CommunityStats>({
    params: { slug },
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.COMMUNITY_STATS,
  });

  return response;
};

export const getCommunityMember = async (slug: string) => {
  const response = await __api<{ isMember: boolean }>({
    params: { slug },
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.COMMUNITY_MEMBER,
  });

  return response;
};

export const getChatConversations = async () => {
  const response = await __api<ChatConversation[]>({
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.CHAT_CONVERSATIONS,
  });

  return response;
};

export const startDirectConversation = async (targetUserID: string) => {
  const response = await __api<ChatConversation>({
    endpoint: API_ENDPOINT.CHAT_CONVERSATIONS,
    init: { body: { targetUserID }, method: REQUEST_METHOD.POST },
  });

  return response;
};

export const getChatMessages = async (conversationID: string, cursor?: string | null) => {
  const response = await __api<ChatMessagesPage>({
    params: { conversationID, ...(cursor ? { cursor } : {}) },
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.CHAT_MESSAGES,
  });

  return response;
};

export const sendChatMessage = async (body: { conversationID: string; body: string }) => {
  const response = await __api<ChatMessage>({
    endpoint: API_ENDPOINT.CHAT_MESSAGES,
    init: { body, method: REQUEST_METHOD.POST },
  });

  return response;
};

export const markChatRead = async (conversationID: string) => {
  const response = await __api<{ ok: boolean }>({
    endpoint: API_ENDPOINT.CHAT_READ,
    init: { body: { conversationID }, method: REQUEST_METHOD.POST },
  });

  return response;
};
