'use server';

import {
  ApiResponse,
  ChatConversation,
  ChatMessage,
  ChatMessagesPage,
  ContentActionKind,
  ContentActionState,
  ContentActionTarget,
  CommentFormState,
  Community,
  CommunityFeed,
  CommunityStats,
  FeedSort,
  ImageBucket,
  Notification,
  ModerationReport,
  Tag,
  User,
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

export const getInitialDisplayName = async (): Promise<string> => {
  const adjectives = ['Bright', 'Cosmic', 'Lunar', 'Nova', 'Solar', 'Stellar'];
  const nouns = ['Comet', 'Explorer', 'Orbit', 'Pioneer', 'Signal', 'Voyager'];
  const seed = crypto.getRandomValues(new Uint32Array(2));
  return `${adjectives[seed[0] % adjectives.length]} ${nouns[seed[1] % nouns.length]}`;
};


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

export const vote = async (body: { target: VoteTarget; targetID: string; value: VoteValue }) => {
  return await __api<{ userVote: VoteValue; score: number }>({
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

export const updateComment = async (body: { commentID: string; body: string }) => {
  return __api<{ comment: NonNullable<CommentFormState>['comment'] }>({
    endpoint: API_ENDPOINT.COMMENTS,
    init: { body, method: REQUEST_METHOD.PATCH },
  });
};

export const deleteComment = async (commentID: string) => {
  return __api<{ ok: boolean }>({
    endpoint: API_ENDPOINT.COMMENTS,
    init: { body: { commentID }, method: REQUEST_METHOD.DELETE },
  });
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

export const getContentAction = async (
  kind: ContentActionKind,
  targetType: ContentActionTarget,
  targetID: string,
) => __api<ContentActionState>({
  endpoint: API_ENDPOINT.CONTENT_ACTIONS,
  params: { kind, targetType, targetID },
  init: { method: REQUEST_METHOD.GET },
});

export const setContentAction = async (body: {
  kind: ContentActionKind;
  targetType: ContentActionTarget;
  targetID: string;
  enabled: boolean;
}) => __api<ContentActionState>({
  endpoint: API_ENDPOINT.CONTENT_ACTIONS,
  init: { body, method: REQUEST_METHOD.POST },
});

export const submitReport = async (body: {
  targetType: 'post' | 'comment' | 'user';
  targetID: string;
  reason: string;
}) => __api<{ ok: boolean }>({
  endpoint: API_ENDPOINT.REPORTS,
  init: { body, method: REQUEST_METHOD.POST },
});

export const getNotifications = async () => __api<Notification[]>({
  endpoint: API_ENDPOINT.NOTIFICATIONS,
  init: { method: REQUEST_METHOD.GET },
});

export const markNotificationRead = async (notificationID?: string) => __api<{ ok: boolean }>({
  endpoint: API_ENDPOINT.NOTIFICATIONS,
  init: {
    body: notificationID ? { notificationID } : { all: true },
    method: REQUEST_METHOD.PATCH,
  },
});

export const getCommunityReports = async (communitySlug: string) => __api<ModerationReport[]>({
  endpoint: API_ENDPOINT.REPORTS,
  params: { communitySlug },
  init: { method: REQUEST_METHOD.GET },
});

export const reviewReport = async (reportID: string, status: 'approved' | 'dismissed') => __api<ModerationReport>({
  endpoint: API_ENDPOINT.REPORTS,
  init: { body: { reportID, status }, method: REQUEST_METHOD.PATCH },
});
