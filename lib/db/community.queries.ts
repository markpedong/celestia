import { cache } from 'react';
import uniq from 'lodash/uniq';
import { prisma } from '@/lib/prisma';
import type { Community, CommunityFeed, CommunityMember, CommunityStats, FeedSort, Tag, TagPostCount } from '@/lib/types';
import { mapCommunityMemberRow, mapCommunityRow, mapTagRow } from './mappers';
import { listPostSorted } from './post.queries';
import { batchAuthorsForIDs, batchUserStatsForIDs } from './user.queries';

export const listCommunity = cache(async (): Promise<Tag[]> => {
  const rows = await prisma.community.findMany({ orderBy: { slug: 'asc' } });
  return rows.map(mapTagRow);
});

export const getCommunityBySlug = cache(async (slug: string): Promise<Community | null> => {
  const community = await prisma.community.findUnique({ where: { slug } });
  return community ? mapCommunityRow(community) : null;
});

export const getCommunityStatsData = async (slug: string): Promise<CommunityStats> => {
  const tagSlug = slug.toLowerCase();
  const [postCount, memberCount, commentCount] = await Promise.all([
    prisma.postTag.count({ where: { tagSlug } }),
    prisma.communityMembers.count({ where: { communitySlug: tagSlug } }),
    prisma.comment.count({ where: { post: { postTags: { some: { tagSlug } } } } }),
  ]);

  return { postCount, memberCount, commentCount };
};

export const listCommunityMembers = async (slug: string): Promise<CommunityMember[]> => {
  const memberships = await prisma.communityMembers.findMany({
    where: { communitySlug: slug },
    orderBy: { joinedAt: 'desc' },
    take: 50,
  });
  const usersByID = await batchAuthorsForIDs(memberships.map(member => member.userID));

  return memberships.flatMap(member => {
    const user = usersByID.get(member.userID);
    return user ? [mapCommunityMemberRow(member, user)] : [];
  });
};

export const listJoinedCommunities = async (userID: string): Promise<Community[]> => {
  const memberships = await prisma.communityMembers.findMany({
    where: { userID },
    orderBy: { joinedAt: 'asc' },
    include: { community: true },
  });

  return memberships.map(({ community }) => mapCommunityRow(community));
};

export const isCommunityMember = cache(async (slug: string, userID: string | undefined): Promise<boolean> => {
  if (!userID) return false;

  const membership = await prisma.communityMembers.findUnique({
    where: { userID_communitySlug: { userID, communitySlug: slug.toLowerCase() } },
    select: { userID: true },
  });

  return Boolean(membership);
});

export const listOwnedCommunities = cache(async (userID: string): Promise<Community[]> => {
  const communities = await prisma.community.findMany({
    where: { createdByID: userID },
    orderBy: { slug: 'asc' },
  });

  return communities.map(mapCommunityRow);
});

export const tagsPostCounts = cache(async (): Promise<TagPostCount[]> => {
  const allTags = await listCommunity();
  const rows = await prisma.postTag.groupBy({
    by: ['tagSlug'],
    _count: { _all: true },
  });

  const countMap = new Map(rows.map(row => [row.tagSlug, row._count._all]));
  return allTags.map(tag => ({ tag, count: countMap.get(tag.slug) ?? 0 }));
});

export const getCommunityFeedData = async (
  slug: string,
  sort: FeedSort,
  userID: string | undefined,
): Promise<CommunityFeed> => {
  const [rows, tags] = await Promise.all([
    listPostSorted(sort, slug, userID),
    listCommunity(),
  ]);
  const authorIDs = uniq(rows.map(({ post }) => post.authorID));
  const [authorsByID, authorStatsByID] = await Promise.all([
    batchAuthorsForIDs(authorIDs),
    batchUserStatsForIDs(authorIDs),
  ]);

  return {
    rows,
    authors: [...authorsByID.values()],
    authorStats: [...authorStatsByID.entries()],
    tags,
  };
};
