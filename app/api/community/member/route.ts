import { HTTP_MESSAGE } from "@/constants/enums";
import { getCurrentUserID } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateErrorResponse, generateSuccessResponse } from "@/services/request";

export const POST = async (req: Request) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

  const { slug } = await req.json();
  if (!slug) return generateErrorResponse(HTTP_MESSAGE.SLUG_REQUIRED, 400);

  const membership = await prisma.communityMembers.findUnique({
    where: { userID_communitySlug: { userID, communitySlug: slug.trim().toLowerCase() } },
    select: { userID: true },
  });

  return generateSuccessResponse({ isMember: Boolean(membership) });
};