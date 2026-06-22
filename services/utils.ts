'use server';

import { revalidateTag } from 'next/cache';
import { TRequestInit } from '@/services/request';
import { REQUEST_METHOD } from '@/constants/enums';

export const refetch = async (tag: string) => revalidateTag(tag, '');

export const generateRequestInit = async (init?: TRequestInit): Promise<TRequestInit> => {
  const body = (() => {
    if (!init) return;
    if (!init.body) return;
    if (typeof init.body === 'string') return init.body;
    return JSON.stringify(init.body);
  })();

  const cache = 'no-store';

  const headers = new Headers({
    'Content-Type': 'application/json;charset=UTF-8',
    ...init?.headers,
  });

  const method = init?.method || REQUEST_METHOD.POST;

  const next = init?.next;

  return {
    body,
    cache,
    headers,
    method,
    next,
  };
};

export const generateParameters = async (params?: {}) => {
  if (!params) return '';
  if (Object.keys(params).length === 0) return '';
  return '?' + new URLSearchParams(params).toString();
};

export const generateHeaders = async (isFormData?: boolean, isPhpToken?: boolean) => {
  const headers = new Headers();

  if (!isFormData) {
    headers.set('Content-Type', 'application/json;charset=UTF-8');
  }

  return headers;
};
