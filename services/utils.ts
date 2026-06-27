'use server';

import { TRequestInit } from '@/services/request';
import { REQUEST_METHOD } from '@/constants/enums';
import { cookies } from 'next/headers';

export const generateRequestInit = async (init?: TRequestInit): Promise<TRequestInit> => {
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const body = (() => {
    if (!init) return;
    if (!init.body) return;
    if (isFormData) return init.body;
    if (typeof init.body === 'string') return init.body;
    return JSON.stringify(init.body);
  })();
  const cookieStore = await cookies();
  const headers = new Headers(init?.headers);
  headers.set('Cookie', cookieStore.toString());
  if (!isFormData) headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json;charset=UTF-8');

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
