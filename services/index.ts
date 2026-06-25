'use server';

import { Community, CommunityFeed, CommunityStats, FeedSort, Tag, User } from "@/lib/types";
import { __api } from "./request";
import { API_ENDPOINT, REQUEST_METHOD } from "@/constants/enums";

export const getProfileByUserName = async ({ username }: { username: string }) => {
  const response = await __api<User>({
    params: { username },
    init: { method: REQUEST_METHOD.GET },
    endpoint: API_ENDPOINT.USER,
  });

  return response;
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
  });

  return response.data;
};

export const updateProfile = async (body: Record<string, unknown>) => {
  return await __api({
    init: { body, method: REQUEST_METHOD.POST, },
    endpoint: API_ENDPOINT.USER,
  });
};


export const updateCommunity = async (body: Tag & { description: string }) => {
  const response = await __api({
    init: { body, method: REQUEST_METHOD.POST },
    endpoint: API_ENDPOINT.COMMUNITY,
  });

  return response;
};

export const getCommunityFeed = async (slug: string, sort: FeedSort) => {
  const response = await __api<CommunityFeed>({
    init: { body: { slug, sort }, method: REQUEST_METHOD.POST },
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
    init: { body: { slug }, method: REQUEST_METHOD.POST },
    endpoint: API_ENDPOINT.COMMUNITY_STATS,
  });

  return response;
};

export const getCommunityMember = async (slug: string) => {
  const response = await __api<{ isMember: boolean }>({
    init: { body: { slug }, method: REQUEST_METHOD.POST },
    endpoint: API_ENDPOINT.COMMUNITY_MEMBER,
  });

  return response;
};
