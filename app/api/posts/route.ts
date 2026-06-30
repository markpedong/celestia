import { MAX_POST_IMAGES } from '@/constants';
import { getCurrentUserID } from '@/lib/auth';
import { listPostSorted, getPostByID, listPostIDs, listPostsByAuthor, listVotedPostsByUser } from '@/lib/db/post.queries';
import { getUploadErrorMessage } from '@/lib/error-messages';
import { prisma } from '@/lib/prisma';
import { parsePublicFileUrl } from '@/lib/storage';
import type { FeedSort } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { removeImages as removeStoredImages } from '@/services';
import { revalidatePath } from 'next/cache';

const parsePostImageUrls = (value: unknown): string[] => {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > MAX_POST_IMAGES) throw new Error(`Upload up to ${MAX_POST_IMAGES} images per post.`);
  if (!value.every(imageUrl => typeof imageUrl === 'string' && parsePublicFileUrl(imageUrl)?.bucket === 'post-images')) {
    throw new Error('Invalid uploaded image.');
  }

  return value;
};

const revalidatePostPaths = (postID?: string, tagSlugs: string[] = []) => {
  for (const path of ['/', '/explore', '/posts', '/top', '/submit']) revalidatePath(path);
  if (postID) revalidatePath(`/post/${postID}`);
  for (const tagSlug of tagSlugs) revalidatePath(`/r/${tagSlug}`);
};

const isFeedSort = (value: string | null): value is FeedSort => value === 'hot' || value === 'new' || value === 'top';
const isVoteValue = (value: string | null): value is '1' | '-1' => value === '1' || value === '-1';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const mode = searchParams.get('mode');

  if (mode === 'ids') {
    return generateSuccessResponse(await listPostIDs());
  }

  if (id) {
    const post = await getPostByID(id);
    return post ? generateSuccessResponse(post) : generateErrorResponse('Post not found.', 404);
  }

  const requestedSort = searchParams.get('sort');
  const sort: FeedSort = isFeedSort(requestedSort) ? requestedSort : 'hot';
  const tag = searchParams.get('tag') ?? '';
  const query = searchParams.get('q') ?? '';
  const authorID = searchParams.get('authorID');
  const votedBy = searchParams.get('votedBy');
  const value = searchParams.get('value');
  const viewerID = searchParams.get('viewerID') ?? undefined;

  if (authorID) return generateSuccessResponse(await listPostsByAuthor(authorID, sort, viewerID));
  if (votedBy && isVoteValue(value)) {
    return generateSuccessResponse(await listVotedPostsByUser(votedBy, Number(value) as -1 | 1, viewerID));
  }

  return generateSuccessResponse(await listPostSorted(sort, tag, viewerID, query));
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to post.', 401);

  const { title, body, communitySlug, images } = await request.json();
  const slug = String(communitySlug ?? '').trim().toLowerCase();

  const membership = await prisma.communityMembers.findUnique({
    where: { userID_communitySlug: { userID, communitySlug: slug } },
    select: { userID: true },
  });
  if (!membership) return generateErrorResponse('Join this community before posting.', 403);

  let imageUrls: string[];
  try {
    imageUrls = parsePostImageUrls(images);
  } catch (error) {
    return generateErrorResponse(getUploadErrorMessage(error, 'We could not upload your images. Please try again.'));
  }

  const community = await prisma.community.findUnique({ where: { slug }, select: { slug: true } });
  if (!community) return generateErrorResponse('Community not found.', 404);

  const post = await prisma.$transaction(async tx => {
    const post = await tx.post.create({ data: { authorID: userID, title: String(title ?? '').trim(), body: String(body ?? '').trim(), imageUrls } });
    await tx.postTag.create({ data: { postID: post.id, tagSlug: community.slug } });
    return post;
  });

  revalidatePostPaths(post.id, [community.slug]);
  return generateSuccessResponse({ postID: post.id });
};

export const PATCH = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to edit a post.', 401);

  const { postID, title, body, images, removeImages } = await request.json();
  const id = String(postID ?? '');
  if (!id) return generateErrorResponse('Post not found.', 404);

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { authorID: true, imageUrls: true, postTags: { select: { tagSlug: true } } },
  });
  if (!existing) return generateErrorResponse('Post not found.', 404);
  if (existing.authorID !== userID) return generateErrorResponse('Only the post author can edit this post.', 403);

  let imageUrls = removeImages ? [] : existing.imageUrls;
  try {
    if (Array.isArray(images)) imageUrls = parsePostImageUrls(images);
  } catch (error) {
    return generateErrorResponse(getUploadErrorMessage(error, 'We could not upload your images. Please try again.'));
  }

  await prisma.post.update({
    where: { id },
    data: { title: String(title ?? '').trim(), body: String(body ?? '').trim(), imageUrls },
  });

  const removedImageUrls = existing.imageUrls.filter(imageUrl => !imageUrls.includes(imageUrl));
  if (removedImageUrls.length > 0) {
    try {
      await removeStoredImages(removedImageUrls, 'post-images');
    } catch {
      // Post save already succeeded; stale storage cleanup can be retried later.
    }
  }

  revalidatePostPaths(id, existing.postTags.map(tag => tag.tagSlug));
  return generateSuccessResponse({ postID: id });
};

export const DELETE = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to delete a post.', 401);

  const { postID } = await request.json();
  const id = String(postID ?? '');
  if (!id) return generateErrorResponse('Post not found.', 404);

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { authorID: true, imageUrls: true, postTags: { select: { tagSlug: true } } },
  });
  if (!existing) return generateErrorResponse('Post not found.', 404);
  if (existing.authorID !== userID) return generateErrorResponse('Only the post author can delete this post.', 403);

  await prisma.post.delete({ where: { id } });
  if (existing.imageUrls.length > 0) {
    try {
      await removeStoredImages(existing.imageUrls, 'post-images');
    } catch {
      // Do not fail the deletion because storage cleanup missed.
    }
  }

  revalidatePostPaths(id, existing.postTags.map(tag => tag.tagSlug));
  return generateSuccessResponse(null, 200, 'Post deleted.');
};
