import type {
  CommunityMembersModel,
  CommunityModel,
  PostModel,
  UsersModel
} from '@/lib/generated/prisma/models';
import type { Community, CommunityMember, Post, SearchTagSuggestion, Tag } from '@/lib/types';

export const mapTagRow = (row: Pick<CommunityModel, 'slug' | 'label' | 'hashColor' | 'avatarUrl'>): Tag => ({
  slug: row.slug,
  label: row.label,
  hashColor: row.hashColor,
  avatarUrl: row.avatarUrl,
});

export const mapCommunityRow = (row: CommunityModel): Community => ({
  slug: row.slug,
  label: row.label,
  description: row.description,
  hashColor: row.hashColor,
  avatarUrl: row.avatarUrl,
  coverUrl: row.coverUrl,
  createdByID: row.createdByID ?? undefined,
  createdAt: row.createdAt.toISOString(),
});

export const mapPostRow = (
  row: PostModel,
  tagSlugs: string[],
  commentCount: number,
): Post => ({
  id: row.id,
  authorID: row.authorID,
  title: row.title,
  body: row.body,
  imageUrls: row.imageUrls,
  tagSlugs,
  createdAt: row.createdAt.toISOString(),
  commentCount,
});

export const mapCommunityMemberRow = (
  member: Pick<CommunityMembersModel, 'joinedAt' | 'userID'>,
  user: UsersModel,
): CommunityMember => ({
  ...user,
  joinedAt: member.joinedAt.toISOString(),
});

export const mapSearchTagSuggestionRow = (
  row: Pick<CommunityModel, 'slug' | 'label' | 'hashColor' | 'avatarUrl'>,
  postCount: number,
): SearchTagSuggestion => ({
  ...mapTagRow(row),
  postCount,
});
