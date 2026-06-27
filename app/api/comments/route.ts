import { getCurrentUserID } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Comment } from '@/lib/types';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';
import { revalidatePath } from 'next/cache';

const addComment = async (input: {
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

export const POST = async (request: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse('You must be signed in to comment.', 401);

  const { postID, parentID = null, body } = await request.json();
  if (typeof postID !== 'string' || typeof body !== 'string' || (parentID !== null && typeof parentID !== 'string')) {
    return generateErrorResponse('Invalid comment.');
  }

  const post = await prisma.post.findUnique({
    where: { id: postID },
    select: { postTags: { select: { tagSlug: true } } },
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

  if (parentID) {
    const parent = await prisma.comment.findFirst({ where: { id: parentID, postID }, select: { id: true } });
    if (!parent) return generateErrorResponse('Reply target not found.', 404);
  }

  const comment = await addComment({ postID, authorID: userID, parentID, body });
  revalidatePath('/');
  revalidatePath(`/post/${postID}`);
  return generateSuccessResponse({ ok: true, comment }, 201, 'Comment posted.');
};
