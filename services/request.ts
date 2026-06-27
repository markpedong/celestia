import { API_ENDPOINT, REQUEST_METHOD } from '@/constants/enums';
import { ApiResponse } from '@/lib/types';
import { generateParameters, generateRequestInit } from '@/services/utils';
import { NextResponse } from 'next/server';

declare function fetch<ResponseType = unknown>(
  input: RequestInfo | URL,
  init?: TRequestInit,
): Promise<IResponse<ResponseType>>;

interface IResponse<ResponseType> extends Response {
  json(): Promise<ApiResponse<ResponseType>>;
}

export type TRequestInit = {
  body?: FormData | string | Record<string, unknown>;
  cache?: RequestCache;
  headers?: HeadersInit;
  method?: REQUEST_METHOD;
  next?: NextFetchRequestConfig;
};

export type TApiArgs = {
  endpoint: API_ENDPOINT;
  init?: TRequestInit;
  params?: Record<string, string>;
};

export const __api = async <TApiResponse = null>({ endpoint, params, init }: TApiArgs) => {
  const parameters = await generateParameters(params);
  const requestInput = process.env.DOMAIN + "/api" + endpoint + parameters;
  const requestInit = await generateRequestInit(init);
  const response = await fetch<TApiResponse>(requestInput, requestInit);

  return await response.json();
};

export const generateSuccessResponse = <T>(data: T, status = 200, message = "Data fetched successfully") => {
  return NextResponse.json({ success: true, data, message }, { status });
}

export const generateErrorResponse = (message: string, status = 400) => {
  return NextResponse.json({ success: false, data: null, message }, { status });
}

export const redirectResponse = (nextPath: string, origin: string) => {
  return NextResponse.redirect(new URL(nextPath, origin));
}
