"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserID } from "../auth";
import type { PostFormState, VoteActionValue } from "../types";
import { redirect } from "next/navigation";
import { removePostImages, uploadPostImages } from "../media";
import { prisma } from '../prisma';
import { toggleVote } from '../db/votes';
import { getUploadErrorMessage } from '../error-messages';

export const votePostAction = async (postID: string, value: VoteActionValue) => {
  const userID = await getCurrentUserID();
  if (!userID) {
    return { error: "Sign in to vote." };
  }

  await toggleVote(userID, 'post', postID, value);
  for (const path of ['/', '/explore', '/posts', '/top']) revalidatePath(path);
  revalidatePath(`/post/${postID}`);
}

export const createPostAction = async (
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> => {
  const userID = await getCurrentUserID();
  if (!userID) {
    return { error: "You must be signed in to post." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const communitySlug = String(formData.get("communitySlug") ?? "").trim().toLowerCase();
  const images = formData.getAll("images");

  const membership = await prisma.communityMembers.findUnique({
    where: { userID_communitySlug: { userID, communitySlug } },
    select: { userID: true },
  });
  if (!membership) {
    return { error: 'Join this community before posting.' };
  }

  let imageUrls: string[];
  try {
    imageUrls = await uploadPostImages(images, userID);
  } catch (error) {
    return { error: getUploadErrorMessage(error, 'We could not upload your images. Please try again.') };
  }

  const community = await prisma.community.findUnique({ where: { slug: communitySlug }, select: { slug: true } });
  if (!community) throw new Error('Community not found.');

  // ponytail: creation only needs the new post id for the redirect.
  const post = await prisma.$transaction(async tx => {
    const post = await tx.post.create({ data: { authorID: userID, title, body, imageUrls } });
    await tx.postTag.create({ data: { postID: post.id, tagSlug: community.slug } });
    return post;
  });

  for (const path of ['/', '/explore', '/posts', '/top']) revalidatePath(path);
  revalidatePath("/submit");
  revalidatePath(`/r/${communitySlug}`);
  redirect(`/post/${post.id}`);
}

export const updatePostAction = async (
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> => {
  const userID = await getCurrentUserID();
  if (!userID) return { error: 'You must be signed in to edit a post.' };

  const postID = String(formData.get('postID') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const removeImages = String(formData.get('removeImages') ?? '') === 'true';
  const images = formData.getAll('images');

  if (!postID) return { error: 'Post not found.' };
  const existing = await prisma.post.findUnique({
    where: { id: postID },
    select: { authorID: true, imageUrls: true, postTags: { select: { tagSlug: true } } },
  });
  if (!existing) return { error: 'Post not found.' };
  if (existing.authorID !== userID) return { error: 'Only the post author can edit this post.' };

  const existingImageUrls = existing.imageUrls;
  let imageUrls = removeImages ? [] : existingImageUrls;
  let replacesExistingImages = removeImages;
  try {
    const uploadedImages = await uploadPostImages(images, userID);
    if (uploadedImages.length > 0) {
      imageUrls = uploadedImages;
      replacesExistingImages = true;
    }
  } catch (error) {
    return { error: getUploadErrorMessage(error, 'We could not upload your images. Please try again.') };
  }

  await prisma.post.update({
    where: { id: postID },
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
  revalidatePath(`/post/${postID}`);
  for (const { tagSlug } of existing.postTags) revalidatePath(`/r/${tagSlug}`);
  redirect(`/post/${postID}`);
}
