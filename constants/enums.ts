export enum API_ENDPOINT {
  USER = '/user',
  USERNAME_LOGIN = '/auth/userName',
  COMMUNITY = '/community',
  COMMUNITY_FEED = '/community/feed',
  COMMUNITY_JOIN = '/community/join',
  COMMUNITY_STATS = '/community/stats',
  COMMUNITY_MEMBER = '/community/member',
}

export enum REQUEST_METHOD {
  DELETE = 'DELETE',
  GET = 'GET',
  POST = 'POST',
}

export enum HTTP_MESSAGE {
  NOT_FOUND = 'NOT FOUND',
  UNAUTHORIZED = "USER NOT AUTHORIZED",
  SLUG_REQUIRED = 'Community slug is required.',
}
