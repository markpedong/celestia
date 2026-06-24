import { prisma } from '@/lib/prisma';
import { generateErrorResponse, generateSuccessResponse } from '@/services/request';

export const dynamic = 'force-dynamic';

export const POST = async (request: Request) => {
  const { slug, sort } = await request.json();

  const community = await prisma.community.findFirst({ where: { slug } });
  if (!community) return generateErrorResponse('Community not found.', 404);

  console.log("community", community, sort);
  // const sessionUser = await getSessionUser();
  // const feed = await getCommunityFeedData(community.slug, sort, sessionUser?.id);
  // const response: CommunityFeedApiResponse = {
  //   ...feed,
  //   authors: feed.authors.map(author => ({ ...author, createdAt: author.createdAt.toISOString() })),
  // };

  // console.log("response", response);

  return generateSuccessResponse(community);
};
