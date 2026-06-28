import { HTTP_MESSAGE } from "@/constants/enums";
import { getCurrentUserID } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateErrorResponse, generateSuccessResponse } from "@/services/request";

const respondWithMembership = async (slug: unknown) => {
  const userID = await getCurrentUserID();
  if (!userID) return generateErrorResponse(HTTP_MESSAGE.UNAUTHORIZED, 401);

  if (!slug) return generateErrorResponse(HTTP_MESSAGE.SLUG_REQUIRED, 400);

  const membership = await prisma.communityMembers.findUnique({
    where: { userID_communitySlug: { userID, communitySlug: String(slug).trim().toLowerCase() } },
    select: { userID: true },
  });

  return generateSuccessResponse({ isMember: Boolean(membership) });
};

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  return respondWithMembership(searchParams.get('slug'));
};

export const POST = async (req: Request) => {
  const { slug } = await req.json();
  return respondWithMembership(slug);
};
