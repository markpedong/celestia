import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';

export type ApiResponse<TResponse = null> = {
  message: string;
  success: boolean;
  data: TResponse | null;
};

export type WithChildren<T extends object = Record<never, never>> = T & {
  children: ReactNode;
};

export type WithOptionalChildren<T extends object = Record<never, never>> = T & {
  children?: ReactNode;
};

export type WithClassName<T extends object = Record<never, never>> = T & {
  className?: string;
};

export type ErrorFormState<T extends object = Record<never, never>> = (T & {
  error?: string;
}) | null;

export type User = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  createdAt: Date;
};

export type Tag = {
  slug: string;
  label: string;
  hashColor: string;
};

export type Community = Tag & {
  description: string;
  createdById?: string;
  createdAt?: string;
};

export type Post = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  imageUrls: string[];
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
  commentKarma: number;
};

export type UserCommentActivity = {
  id: string;
  postId: string;
  postTitle: string;
  body: string;
  createdAt: string;
};

export type VoteValue = -1 | 0 | 1;

export type VoteActionValue = -1 | 1;

export type TrendingItem = {
  rank: number;
  title: string;
  postCount: string;
};

export type TagPostCount = {
  tag: Tag;
  count: number;
};

export type FeedPostRow = {
  post: Post;
  score: number;
  userVote: VoteValue;
};

export type CommunityData = {
  rows: FeedPostRow[];
  authors: User[];
  authorStats: [string, UserStats][];
  tags: Tag[];
};

export type EnrichedCommentNode = {
  id: string;
  postId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  authorId: string;
  author: User;
  score: number;
  userVote: VoteValue;
  isPending?: boolean;
  children: EnrichedCommentNode[];
};

export type EnrichedCommentRow = Comment & {
  author: User;
  score: number;
  userVote: VoteValue;
};

export type ImageBucket = 'profile-avatars' | 'profile-covers' | 'post-images';

export type PostFormState = ErrorFormState;

export type CommentFormState = ErrorFormState<{ ok?: boolean; comment?: Comment }>;

export type CommunityFormState = ErrorFormState;

export type CommunitySettingsFormState = ErrorFormState;

export type ProfileMediaFormState = ErrorFormState<{ success?: string }>;

export type AuthMode = 'sign-in' | 'sign-up';

export type AuthMethodsProps = {
  mode: AuthMode;
};
export type CommunitySettingsFormProps = {
  community: Community;
};

export type FeedSortTabsProps = {
  current: FeedSort;
  tag: string;
  query: string;
  basePath?: string;
  hotPath?: string;
};

export type PostCardProps = {
  post: Post;
  author?: User;
  authorStats: UserStats;
  tagsBySlug: Map<string, Tag>;
  score: number;
  userVote: VoteValue;
  isSignedIn: boolean;
};

export type PostListProps = {
  rows: FeedPostRow[];
  authorsById: Map<string, User>;
  authorStatsById: Map<string, UserStats>;
  tagsBySlug: Map<string, Tag>;
  isSignedIn: boolean;
};

export type PostMetaProps = WithClassName<{
  author?: User;
  authorStats?: UserStats;
  post: Pick<Post, 'createdAt' | 'tagSlugs'>;
  tagsBySlug: Map<string, Tag>;
  compact?: boolean;
}>;

export type VoteButtonsProps = {
  target: VoteTarget;
  targetID: string;
  score: number;
  userVote: VoteValue;
  isSignedIn: boolean;
};

export type ContentWithSidebarProps = WithChildren<WithClassName<{
  sidebar: ReactNode;
  contentClassName?: string;
  sidebarClassName?: string;
}>>;

export type LeftTagsProps = {
  tags: TagPostCount[];
  emptyMessage?: string;
};

export type NavbarProps = {
  trending: TrendingItem[];
  communities: SearchTagSuggestion[];
};

export type SearchSuggestionsResponse = {
  posts: SearchPostSuggestion[];
  tags: SearchTagSuggestion[];
};

export type SearchBoxProps = {
  trending: TrendingItem[];
  communities: SearchTagSuggestion[];
};

export type SearchSectionProps = {
  title: string;
  children: ReactNode;
};

export type RightTrendingProps = {
  items: TrendingItem[];
  communities: SearchTagSuggestion[];
};

export type CommentComposerProps = {
  postID: string;
  user: User;
  parentId?: string | null;
  placeholder?: string;
  compact?: boolean;
};

export type PendingCommentInput = {
  postId: string;
  parentId: string | null;
  body: string;
  author: User;
};

export type CommentSubmitResult = ErrorFormState;

export type CommentSubmissionContextValue = {
  submitComment: (pendingComment: PendingCommentInput) => Promise<CommentSubmitResult>;
  pending: boolean;
};

export type CommentNodeProps = {
  node: EnrichedCommentNode;
  postAuthorId: string;
  sessionUser: User | null;
  activeReplyId: string | null;
  onReplyChange: (commentId: string | null) => void;
};

export type CommentThreadProps = {
  tree: EnrichedCommentNode[];
  postAuthorId: string;
  sessionUser: User | null;
  children: ReactNode;
};

export type ImageUploadFieldProps = {
  initialImageUrls?: string[];
  name?: string;
  multiple?: boolean;
};

export type SubmitPostFormProps = {
  communities: Community[];
  defaultCommunitySlug?: string;
};

export type EditPostFormProps = {
  post: Post;
};

export type ProfileActivityTab = 'overview' | 'posts' | 'comments' | 'upvoted' | 'downvoted';

export type ProfileActivityTabsProps = {
  children: React.ReactNode[];
};

export type EmptyStateProps = WithOptionalChildren<WithClassName<{
  icon: LucideIcon;
  title: string;
  description: string;
}>>;

export type StatItem = {
  label: string;
  value: string;
};

export type StatGridProps = WithClassName<{
  stats: StatItem[];
}>;

export type UserAvatarProps = {
  user: User;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
};

export type SearchParams = Record<string, string | string[] | undefined>;

export type RouteProps<T extends Record<string, string>> = {
  params: Promise<T>;
};

export type SearchParamsProps<T extends SearchParams = SearchParams> = {
  searchParams: Promise<T>;
};

export type MainLayoutProps = WithChildren;

export type RootLayoutProps = Readonly<MainLayoutProps>;

export type HomePageProps = SearchParamsProps;

export type PostPageProps = RouteProps<{ id: string }>;

export type CommunityPageProps = RouteProps<{ slug: string }> & SearchParamsProps;

export type CommunitySettingsPageProps = RouteProps<{ slug: string }>;

export type UserPageProps = RouteProps<{ username: string }> & SearchParamsProps<{ tab?: string | string[] }>;

export type AuthPageProps = RouteProps<{ pathname: string }>;

export type SubmitPageProps = SearchParamsProps<{ community?: string | string[] }>;

export type CommentsListProps = {
  comments: UserCommentActivity[];
  title: string;
};

export type PostImageGalleryProps = {
  imageUrls: string[];
  title: string;
  variant: 'thumbnail' | 'gallery';
};

export type FormFieldProps = Omit<React.ComponentProps<'input'>, 'id' | 'name'> & {
  name?: string;
  id?: string;
  htmlFor?: string;
  label: React.ReactNode;
  children?: React.ReactNode;
  wrapperClassName?: string;
  labelClassName?: string;
  error?: string;
  hint?: React.ReactNode;
};

export type PasswordFieldProps = Omit<ComponentProps<typeof Input>, 'type'> & Pick<FormFieldProps, 'error' | 'label' | 'labelClassName'>;

export type PasswordRecoveryValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type ChangePasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };


export type SensitiveSetting = 'email' | 'phone' | 'gender' | 'location' | 'passkey' | 'mfa' | 'backupCodes';
export type EditableSetting = 'email' | 'phone' | 'gender' | 'location';

export type AccountDialog =
  | { type: 'verify'; setting: SensitiveSetting }
  | { type: 'edit'; setting: EditableSetting; token: string }
  | { type: 'changePassword' }
  | { type: 'setPassword' }
  | { type: 'mfa' }
  | { type: 'backupCodes' }
  | { type: 'deleteAccount' }
  | null;
