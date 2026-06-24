import { getSessionUser } from '@/lib/auth';
import { getCommunityFeedData } from '@/lib/db/queries';
import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => {
  const { slug, sort } = await request.json();

  const community = await prisma.community.findFirst({ where: { slug } });
  if (!community) return generateErrorResponse('Community not found.', 404);

  const sessionUser = await getSessionUser();
  const feed = await getCommunityFeedData(community.slug, sort, sessionUser?.id);

  return generateSuccessResponse(feed);
};
