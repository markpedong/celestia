"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserID } from "../auth";
import { getUserVote } from "../db/queries";
import { prisma } from "../prisma";
import { Post } from "../types";
import { PostModel } from "../generated/prisma/models";
import { redirect } from "next/navigation";
import { uploadImage } from "../media";

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
  const current = await getUserVote(userId, "post", postId); // if you already voted
  let next: -1 | 0 | 1 = value; // new vote
  if (current === value) next = 0; // if same, then you unvote, meaning you can be neutral.

  // reason for this is becuase there can only be one vote per post.
  await prisma.vote.deleteMany({
    where: {
      userId,
      targetType: "post",
      targetId: postId,
    },
  });

  if (next !== 0) {
    await prisma.vote.create({
      data: {
        userId,
        targetType: "post",
        targetId: postId,
        value: next,
      },
    });
  }
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
  const tagsRaw = String(formData.get("tags") ?? "");
  const image = formData.get("image");

  if (title.trim().length < 4) {
    return { error: "Title is too short." };
  }

  const tagSlugs = tagsRaw
    .split(/[,#\s]+/)
    .map((s) => s.trim().toLowerCase())
    .slice(0, 5);

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
    tagSlugs,
    imageUrl,
  });

  revalidatePath("/");
  revalidatePath("/submit");
  redirect(`/post/${post.id}`);
}

export const addPost = async (input: {
  authorId: string;
  title: string;
  body: string;
  tagSlugs: string[];
  imageUrl?: string;
}): Promise<Post> => {
  const tagSlugs = input.tagSlugs.length ? input.tagSlugs : ["webdev"];
  await prisma.tag.createMany({
    data: tagSlugs.map((slug) => ({
      slug,
      label: slug,
      hashColor: "#ff00fb",
    })),
    skipDuplicates: true,
  });

  const row = await prisma.post.create({
    data: {
      authorId: input.authorId,
      title: input.title.trim(),
      body: input.body.trim(),
      imageUrl: input.imageUrl,
    },
  });

  await prisma.postTag.createMany({
    data: tagSlugs.map((slug) => ({
      postId: row.id,
      tagSlug: slug,
    })),
  });

  return mapPostRow(row, tagSlugs, 0);
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
