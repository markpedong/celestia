'use server';

import { CommunityData, CommunityStats, FeedSort, User } from "@/lib/types";
import { __api } from "./request";
import { API_ENDPOINT, REQUEST_METHOD } from "@/constants/enums";

export const getProfileByUserName = async ({ userName }: { userName: string }) => {
  const response = await __api<User>({
    init: { body: { userName } },
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


export const getCommunityFeed = async (slug: string, sort: FeedSort) => {
  const response = await __api<CommunityData>({
    init: { body: { slug, sort }, method: REQUEST_METHOD.POST },
    endpoint: API_ENDPOINT.COMMUNITY,
  });

  console.log('response', response);
  return response.data;
};

export const joinCommunity = async (slug: string) => {
  const response = await __api({
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