"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserID } from "../auth";
import { prisma } from "../prisma";
import type { Comment, CommentFormState, VoteActionValue } from "../types";
import { toggleVote } from '../db/votes';

export const createCommentAction = async ({ postId, parentId, body }: { postId: string; parentId: string | null; body: string }): Promise<CommentFormState> => {
  const userId = await getCurrentUserID();
  if (!userId) {
    return { error: "You must be signed in to comment." };
  }

  const comment = await addComment({ postId, authorId: userId, parentId, body });

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
  return { ok: true, comment };
}

export const addComment = async (input: {
  postId: string;
  authorId: string;
  parentId: string | null;
  body: string;
}): Promise<Comment> => {
  const row = await prisma.comment.create({
    data: {
      postId: input.postId,
      authorId: input.authorId,
      parentId: input.parentId,
      body: input.body.trim(),
    },
  });

  return {
    id: row.id,
    postId: row.postId,
    authorId: row.authorId,
    parentId: row.parentId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
};

export const voteCommentAction = async (commentId: string, value: VoteActionValue) => {
  const userId = await getCurrentUserID();
  if (!userId) {
    return { error: "Sign in to vote." };
  }
  const row = await findCommentById(commentId);
  if (!row) return { error: "Comment not found." };
  await voteComment(userId, commentId, value);
  revalidatePath(`/post/${row.postId}`);
  revalidatePath("/");
}

export const voteComment = async (
  userId: string,
  commentId: string,
  value: VoteActionValue,
): Promise<void> => {
  await toggleVote(userId, 'comment', commentId, value);
};

export const findCommentById = async (id: string): Promise<Comment | undefined> => {
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) return undefined;
  return {
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    parentId: c.parentId,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  };
}
