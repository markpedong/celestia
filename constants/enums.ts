export enum API_ENDPOINT {
  USER = '/user',
  USER_COMMUNITIES = '/user/communities',
  USER_OWNED_COMMUNITIES = '/user/owned-communities',
  USER_STATS = '/user/stats',
  USERNAME_LOGIN = '/auth/username',
  COMMUNITY = '/community',
  COMMUNITY_COUNTS = '/community/counts',
  COMMUNITY_FEED = '/community/feed',
  COMMUNITY_JOIN = '/community/join',
  COMMUNITY_MEMBERS = '/community/members',
  COMMUNITY_STATS = '/community/stats',
  COMMUNITY_MEMBER = '/community/member',
  IMAGES = '/images',
  COMMENTS = '/comments',
  POSTS = '/posts',
  SEARCH_SUGGESTIONS = '/search/suggestions',
  VOTES = '/votes',
}

export enum REQUEST_METHOD {
  DELETE = 'DELETE',
  GET = 'GET',
  PATCH = 'PATCH',
  POST = 'POST',
}

export enum HTTP_MESSAGE {
  NOT_FOUND = 'NOT FOUND',
  UNAUTHORIZED = "USER NOT AUTHORIZED",
  SLUG_REQUIRED = 'Community slug is required.',
}
