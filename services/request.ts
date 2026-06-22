import { DEFAULT_ERROR } from '@/constants';
import { API_ENDPOINT, REQUEST_METHOD } from '@/constants/enums';
import { __TRootResponse } from '@/lib/types';
import { generateParameters, generateRequestInit } from '@/services/utils';

declare function fetch<ResponseType = any>(
  input: RequestInfo | URL,
  init?: TRequestInit,
): Promise<IResponse<ResponseType>>;

interface IResponse<ResponseType> extends Response {
  json(): Promise<__TRootResponse<ResponseType>>;
}

export type TRequestInit = {
  body?: string | {};
  cache?: RequestCache;
  headers?: HeadersInit;
  method?: REQUEST_METHOD;
  next?: NextFetchRequestConfig;
};

export type TApiArgs = {
  endpoint: API_ENDPOINT;
  init?: TRequestInit;
  params?: {};
};

export const __api = async <TApiResponse = null>({ endpoint, params, init }: TApiArgs) => {
  const parameters = await generateParameters(params);
  const requestInput = process.env.DOMAIN + "/api" + endpoint + parameters;
  const requestInit = await generateRequestInit(init);
  const response = await fetch<TApiResponse>(requestInput, requestInit);
  if (!response.ok) return DEFAULT_ERROR;
  return await response.json();
};
