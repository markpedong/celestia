import { getCurrentUserID } from '@/lib/auth';
import { getCommentTree, listComments, listVotedCommentsByUser } from '@/lib/db/comment.queries';
import { prisma } from '@/lib/prisma';
import { invalidateFeedCache } from '@/lib/server/feed-cache';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { commentSchema } from '@/lib/form-schemas';
import type { Comment } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { revalidatePath } from 'next/cache';

const addComment = async (input: {
  postID: string;
  authorID: string;
  parentID: string | null;
  body: string;
  notification?: { userID: string; type: 'comment' | 'reply'; message: string };
}): Promise<Comment> => {
  const row = await prisma.$transaction(async tx => {
    const comment = await tx.comment.create({
      data: {
        postID: input.postID,
        authorID: input.authorID,
        parentID: input.parentID,
        body: input.body.trim(),
      },
    });
    if (input.notification && input.notification.userID !== input.authorID) {
      await tx.notification.create({
        data: {
          ...input.notification,
          actorID: input.authorID,
          href: `/post/${input.postID}#comment-${comment.id}`,
        },
      });
    }
    return comment;
  });

  return {
    id: row.id,
    postID: row.postID,
    authorID: row.authorID,
    parentID: row.parentID,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
};

const serializeComment = (row: {
  id: string;
  postID: string;
  authorID: string;
  parentID: string | null;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
}): Comment => ({
  id: row.id,
  postID: row.postID,
  authorID: row.authorID,
  parentID: row.parentID,
  body: row.body,
  createdAt: row.createdAt.toISOString(),
  editedAt: row.editedAt?.toISOString() ?? null,
  deletedAt: row.deletedAt?.toISOString() ?? null,
});

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const postID = searchParams.get('postID');
  const authorID = searchParams.get('authorID');
  const votedBy = searchParams.get('votedBy');
  const value = searchParams.get('value');
  const viewerID = await getCurrentUserID();

  if (postID) return generateSuccessResponse(await getCommentTree(postID, viewerID));
  if (authorID) return generateSuccessResponse(await listComments({ authorID }));
  if (votedBy && (value === '1' || value === '-1')) {
    return generateSuccessResponse(await listVotedCommentsByUser(votedBy, Number(value) as -1 | 1));
  }

  return generateErrorResponse('Comment query is required.');
};

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to comment.', 401);
  if (!await checkRateLimit(`comment:${userID}`, 30, 60)) {
    return generateErrorResponse('You are commenting too quickly. Try again in a moment.', 429);
  }

  const { postID, parentID = null, body } = await request.json();
  if (typeof postID !== 'string' || typeof body !== 'string' || (parentID !== null && typeof parentID !== 'string')) {
    return generateErrorResponse('Invalid comment.');
  }
  const parsed = commentSchema.safeParse({ body });
  if (!parsed.success) return generateErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid comment.');

  const post = await prisma.post.findUnique({
    where: { id: postID },
    select: { authorID: true, postTags: { select: { tagSlug: true } } },
  });
  if (!post) return generateErrorResponse('Post not found.', 404);

  const communitySlugs = post.postTags.map(({ tagSlug }) => tagSlug);
  const membership = communitySlugs.length
    ? await prisma.communityMembers.findFirst({
      where: { userID, communitySlug: { in: communitySlugs } },
      select: { userID: true },
    })
    : null;
  if (!membership) return generateErrorResponse('Join this community before commenting.', 403);

  let parentAuthorID: string | null = null;
  if (parentID) {
    const parent = await prisma.comment.findFirst({ where: { id: parentID, postID }, select: { id: true, authorID: true } });
    if (!parent) return generateErrorResponse('Reply target not found.', 404);
    parentAuthorID = parent.authorID;
  }

  const notificationUserID = parentAuthorID ?? post.authorID;
  const comment = await addComment({
    postID,
    authorID: userID,
    parentID,
    body: parsed.data.body,
    notification: notificationUserID === userID ? undefined : {
      userID: notificationUserID,
      type: parentID ? 'reply' : 'comment',
      message: parentID ? 'Someone replied to your comment.' : 'Someone commented on your post.',
    },
  });
  revalidatePath('/');
  revalidatePath(`/post/${postID}`);
  await invalidateFeedCache();
  return generateSuccessResponse({ ok: true, comment }, 201, 'Comment posted.');
};

export const PATCH = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to edit a comment.', 401);
  if (!await checkRateLimit(`comment-edit:${userID}`, 40, 600)) {
    return generateErrorResponse('Comment update limit reached. Try again later.', 429);
  }

  const { commentID, body } = await request.json();
  if (typeof commentID !== 'string') return generateErrorResponse('Comment not found.', 404);
  const parsed = commentSchema.safeParse({ body });
  if (!parsed.success) return generateErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid comment.');

  const comment = await prisma.comment.findUnique({
    where: { id: commentID },
    select: { authorID: true, postID: true, deletedAt: true },
  });
  if (!comment) return generateErrorResponse('Comment not found.', 404);
  if (comment.authorID !== userID) return generateErrorResponse('Only the comment author can edit this comment.', 403);
  if (comment.deletedAt) return generateErrorResponse('Deleted comments cannot be edited.');

  const updated = await prisma.comment.update({
    where: { id: commentID },
    data: { body: parsed.data.body, editedAt: new Date() },
  });
  revalidatePath(`/post/${comment.postID}`);
  return generateSuccessResponse({ comment: serializeComment(updated) }, 200, 'Comment updated.');
};

export const DELETE = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to delete a comment.', 401);
  if (!await checkRateLimit(`comment-delete:${userID}`, 30, 600)) {
    return generateErrorResponse('Comment deletion limit reached. Try again later.', 429);
  }

  const { commentID } = await request.json();
  if (typeof commentID !== 'string') return generateErrorResponse('Comment not found.', 404);
  const comment = await prisma.comment.findUnique({
    where: { id: commentID },
    select: { authorID: true, postID: true, deletedAt: true },
  });
  if (!comment) return generateErrorResponse('Comment not found.', 404);
  if (comment.authorID !== userID) return generateErrorResponse('Only the comment author can delete this comment.', 403);

  if (!comment.deletedAt) {
    await prisma.comment.update({ where: { id: commentID }, data: { deletedAt: new Date() } });
  }
  revalidatePath(`/post/${comment.postID}`);
  await invalidateFeedCache();
  return generateSuccessResponse({ ok: true }, 200, 'Comment deleted.');
};
