"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserID } from "../auth";
import type { Post, PostFormState, VoteActionValue } from "../types";
import { PostModel } from "../generated/prisma/models";
import { redirect } from "next/navigation";
import { removePostImages, uploadPostImages } from "../media";
import { prisma } from '../prisma';
import { toggleVote } from '../db/votes';
import { MAX_POST_BODY_LENGTH, MAX_POST_TITLE_LENGTH, MIN_POST_TITLE_LENGTH } from '../constants';
import { getUploadErrorMessage } from '../error-messages';

export const votePostAction = async (postId: string, value: VoteActionValue) => {
  const userId = await getCurrentUserID();
  if (!userId) {
    return { error: "Sign in to vote." };
  }

  await votePost(userId, postId, value);
  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}

export const votePost = async (
  userId: string,
  postId: string,
  value: VoteActionValue,
): Promise<void> => {
  await toggleVote(userId, 'post', postId, value);
}

export const createPostAction = async (
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> => {
  const userId = await getCurrentUserID();
  if (!userId) {
    return { error: "You must be signed in to post." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const communitySlug = String(formData.get("communitySlug") ?? "").trim().toLowerCase();
  const images = formData.getAll("images");

  if (title.trim().length < MIN_POST_TITLE_LENGTH) {
    return { error: "Title is too short." };
  }
  if (title.length > MAX_POST_TITLE_LENGTH) return { error: `Title must be ${MAX_POST_TITLE_LENGTH} characters or fewer.` };
  if (body.length > MAX_POST_BODY_LENGTH) return { error: `Post body must be ${MAX_POST_BODY_LENGTH.toLocaleString()} characters or fewer.` };

  if (!communitySlug) {
    return { error: 'Choose a community before posting.' };
  }

  const membership = await prisma.communityMembership.findUnique({
    where: { userId_communitySlug: { userId, communitySlug } },
    select: { userId: true },
  });
  if (!membership) {
    return { error: 'Join this community before posting.' };
  }

  let imageUrls: string[];
  try {
    imageUrls = await uploadPostImages(images, userId);
  } catch (error) {
    return { error: getUploadErrorMessage(error, 'We could not upload your images. Please try again.') };
  }

  const post = await addPost({
    authorId: userId,
    title,
    body,
    communitySlug,
    imageUrls,
  });

  revalidatePath("/");
  revalidatePath("/submit");
  revalidatePath(`/r/${communitySlug}`);
  redirect(`/post/${post.id}`);
}

export const updatePostAction = async (
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> => {
  const userId = await getCurrentUserID();
  if (!userId) return { error: 'You must be signed in to edit a post.' };

  const postId = String(formData.get('postId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const removeImages = String(formData.get('removeImages') ?? '') === 'true';
  const images = formData.getAll('images');

  if (!postId) return { error: 'Post not found.' };
  if (title.length < MIN_POST_TITLE_LENGTH) return { error: 'Title is too short.' };
  if (title.length > MAX_POST_TITLE_LENGTH) return { error: `Title must be ${MAX_POST_TITLE_LENGTH} characters or fewer.` };
  if (body.length > MAX_POST_BODY_LENGTH) return { error: `Post body must be ${MAX_POST_BODY_LENGTH.toLocaleString()} characters or fewer.` };

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, imageUrls: true, postTags: { select: { tagSlug: true } } },
  });
  if (!existing) return { error: 'Post not found.' };
  if (existing.authorId !== userId) return { error: 'Only the post author can edit this post.' };

  const existingImageUrls = existing.imageUrls;
  let imageUrls = removeImages ? [] : existingImageUrls;
  let replacesExistingImages = removeImages;
  try {
    const uploadedImages = await uploadPostImages(images, userId);
    if (uploadedImages.length > 0) {
      imageUrls = uploadedImages;
      replacesExistingImages = true;
    }
  } catch (error) {
    return { error: getUploadErrorMessage(error, 'We could not upload your images. Please try again.') };
  }

  await prisma.post.update({
    where: { id: postId },
    data: { title, body, imageUrls },
  });

  if (replacesExistingImages && existingImageUrls.length > 0) {
    try {
      await removePostImages(existingImageUrls);
    } catch {
      // The post update is already complete; a failed cleanup must not block it.
    }
  }

  revalidatePath('/');
  revalidatePath('/submit');
  revalidatePath(`/post/${postId}`);
  for (const { tagSlug } of existing.postTags) revalidatePath(`/r/${tagSlug}`);
  redirect(`/post/${postId}`);
}

export const addPost = async (input: {
  authorId: string;
  title: string;
  body: string;
  communitySlug: string;
  imageUrls: string[];
}): Promise<Post> => {
  const communitySlug = input.communitySlug.trim().toLowerCase();
  const community = await prisma.tag.findUnique({ where: { slug: communitySlug }, select: { slug: true } });
  if (!community) throw new Error('Community not found.');

  const row = await prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        authorId: input.authorId,
        title: input.title.trim(),
        body: input.body.trim(),
        imageUrls: input.imageUrls,
      },
    });

    await tx.postTag.create({
      data: {
        postId: post.id,
        tagSlug: community.slug,
      },
    });

    return post;
  });

  return mapPostRow(row, [community.slug], 0);
}

const mapPostRow = (
  row: PostModel,
  tagSlugs: string[],
  commentCount: number,
): Post => {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    body: row.body,
    imageUrls: row.imageUrls,
    tagSlugs,
    createdAt: row.createdAt.toISOString(),
    commentCount,
  };
}
