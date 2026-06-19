export type User = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  coverUrl?: string;
  createdAt?: string;
};

export type Tag = {
  slug: string;
  label: string;
  hashColor: string;
};

export type Community = Tag;

export type Post = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  imageUrl?: string;
  tagSlugs: string[];
  createdAt: string;
  commentCount: number;
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
};

export type FeedSort = "hot" | "new" | "top";

export type VoteTarget = "post" | "comment";

export type SearchPostSuggestion = {
  id: string;
  title: string;
  body: string;
  tagSlugs: string[];
};

export type SearchTagSuggestion = Tag & {
  postCount: number;
};

export type CommunityStats = {
  postCount: number;
  memberCount: number;
  commentCount: number;
};

export type UserStats = {
  postCount: number;
  commentCount: number;
  karma: number;
};

export type UserCommentActivity = {
  id: string;
  postId: string;
  postTitle: string;
  body: string;
  createdAt: string;
};
