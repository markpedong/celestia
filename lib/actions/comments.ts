"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserID } from "../auth";
import { prisma } from "../prisma";
import type { Comment, CommentFormState, VoteActionValue } from "../types";
import { toggleVote } from '../db/votes';

export const createCommentAction = async ({ postID, parentID, body }: { postID: string; parentID: string | null; body: string }): Promise<CommentFormState> => {
  const userID = await getCurrentUserID();
  if (!userID) {
    return { error: "You must be signed in to comment." };
  }

  const comment = await addComment({ postID, authorID: userID, parentID, body });

  revalidatePath(`/post/${postID}`);
  revalidatePath("/");
  return { ok: true, comment };
}

export const addComment = async (input: {
  postID: string;
  authorID: string;
  parentID: string | null;
  body: string;
}): Promise<Comment> => {
  const row = await prisma.comment.create({
    data: {
      postID: input.postID,
      authorID: input.authorID,
      parentID: input.parentID,
      body: input.body.trim(),
    },
  });

  return {
    id: row.id,
    postID: row.postID,
    authorID: row.authorID,
    parentID: row.parentID,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
};

export const voteCommentAction = async (commentID: string, value: VoteActionValue) => {
  const userID = await getCurrentUserID();
  if (!userID) {
    return { error: "Sign in to vote." };
  }
  const row = await findCommentByID(commentID);
  if (!row) return { error: "Comment not found." };
  await voteComment(userID, commentID, value);
  revalidatePath(`/post/${row.postID}`);
  revalidatePath("/");
}

export const voteComment = async (
  userID: string,
  commentID: string,
  value: VoteActionValue,
): Promise<void> => {
  await toggleVote(userID, 'comment', commentID, value);
};

export const findCommentByID = async (id: string): Promise<Comment | undefined> => {
  const c = await prisma.comment.findUnique({ where: { id } });
  if (!c) return undefined;
  return {
    id: c.id,
    postID: c.postID,
    authorID: c.authorID,
    parentID: c.parentID,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
  };
}
