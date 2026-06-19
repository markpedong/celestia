"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserID } from "../auth";
import { Post } from "../types";
import { PostModel } from "../generated/prisma/models";
import { redirect } from "next/navigation";
import { uploadImage } from "../media";
import { prisma } from '../prisma';
import { toggleVote } from '../db/votes';

export const votePostAction = async (postId: string, value: -1 | 1) => {
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
  value: -1 | 1,
): Promise<void> => {
  await toggleVote(userId, 'post', postId, value);
}

export type PostFormState = { error?: string } | null;

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
