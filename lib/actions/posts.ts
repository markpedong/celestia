"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserID } from "../auth";
import type { Post, PostFormState, VoteActionValue } from "../types";
import { PostModel } from "../generated/prisma/models";
import { redirect } from "next/navigation";
import { uploadImage } from "../media";
import { prisma } from '../prisma';
import { toggleVote } from '../db/votes';

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

  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  const communitySlug = String(formData.get("communitySlug") ?? "").trim().toLowerCase();
  const image = formData.get("image");

  if (title.trim().length < 4) {
    return { error: "Title is too short." };
  }

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

  let imageUrl: string | undefined;
  try {
    imageUrl = await uploadImage(image, "post-images", userId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to upload image." };
  }

  const post = await addPost({
    authorId: userId,
    title,
    body,
    communitySlug,
    imageUrl,
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
  const removeImage = String(formData.get('removeImage') ?? '') === 'true';
  const image = formData.get('image');

  if (!postId) return { error: 'Post not found.' };
  if (title.length < 4) return { error: 'Title is too short.' };

  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, imageUrl: true, postTags: { select: { tagSlug: true } } },
  });
  if (!existing) return { error: 'Post not found.' };
  if (existing.authorId !== userId) return { error: 'Only the post author can edit this post.' };

  let imageUrl: string | null = removeImage ? null : existing.imageUrl;
  try {
    const uploadedImage = await uploadImage(image, 'post-images', userId);
    if (uploadedImage) imageUrl = uploadedImage;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to upload image.' };
  }

  await prisma.post.update({ where: { id: postId }, data: { title, body, imageUrl } });

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
  imageUrl?: string;
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
        imageUrl: input.imageUrl,
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
    imageUrl: row.imageUrl ?? undefined,
    tagSlugs,
    createdAt: row.createdAt.toISOString(),
    commentCount,
  };
}
