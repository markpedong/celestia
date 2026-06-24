'use server';

import { CommunityFeedApiResponse, FeedSort, User } from "@/lib/types";
import { __api } from "./request";
import { API_ENDPOINT, REQUEST_METHOD } from "@/constants/enums";

export const getProfileByUserName = async ({ username }: { username: string }) => {
  const response = await __api<User>({
    init: { body: { username } },
    endpoint: API_ENDPOINT.USER,
  });

  return response;
};

export const getEmailByUsername = async (username: string) => {
  const response = await __api<{ email: string }>({
    init: { body: { username } },
    endpoint: API_ENDPOINT.USERNAME_LOGIN,
  });

  return response.data?.email ?? null;
};


export const getCommunityFeed = async (slug: string, sort: FeedSort) => {
  const response = await __api<CommunityFeedApiResponse>({
    init: { body: { slug, sort }, method: REQUEST_METHOD.POST },
    endpoint: API_ENDPOINT.COMMUNITY,
  });

  console.log('response', response);
  return response.data;
};



export const getInitialDisplayName = async (): Promise<string> =>
  ((await (await fetch('https://random-word-api.herokuapp.com/word?number=2')).json()) as string[]).join('-');