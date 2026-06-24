import { HTTP_MESSAGE } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { generateErrorResponse, generateSuccessResponse } from "@/services/request";

export const POST = async (request: Request) => {
  const { slug } = await request.json();
  if (!slug) return generateErrorResponse(HTTP_MESSAGE.NOT_FOUND, 404);

  const tagSlug = slug.toLowerCase();
  const [postCount, memberCount, commentRows] = await Promise.all([
    prisma.postTag.count({ where: { tagSlug } }),
    prisma.communityMembers.count({ where: { communitySlug: tagSlug } }),
    prisma.comment.count({
      where: { post: { postTags: { some: { tagSlug } } } },
    }),
  ]);

  return generateSuccessResponse({
    postCount,
    memberCount,
    commentCount: commentRows,
  });
}