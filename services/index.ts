'use server';

import { User } from "@/lib/types";
import { __api } from "./request";
import { API_ENDPOINT } from "@/constants/enums";

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
