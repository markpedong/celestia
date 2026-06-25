'use server';

import { TRequestInit } from '@/services/request';
import { REQUEST_METHOD } from '@/constants/enums';
import { cookies } from 'next/headers';

export const generateRequestInit = async (init?: TRequestInit): Promise<TRequestInit> => {
  const body = (() => {
    if (!init) return;
    if (!init.body) return;
    if (typeof init.body === 'string') return init.body;
    return JSON.stringify(init.body);
  })();
  const cookieStore = await cookies();
  const headers = new Headers({
    'Content-Type': 'application/json;charset=UTF-8',
    Cookie: cookieStore.toString(),
    ...init?.headers,
  });

  const method = init?.method || REQUEST_METHOD.POST;
  const next = init?.next;

  return {
    body,
    cache: 'no-store',
    headers,
    method,
    next,
  };
};

export const generateParameters = async (params?: Record<string, string>) => {
  if (!params) return '';
  if (Object.keys(params).length === 0) return '';
  return '?' + new URLSearchParams(params).toString();
};
